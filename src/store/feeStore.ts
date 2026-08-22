import { create } from "zustand";
import { useAuthStore } from "./authStore";
import { db } from "@/lib/firebase/firebase";
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  onSnapshot, query, where, writeBatch 
} from "firebase/firestore";

// ==========================================
// TYPES
// ==========================================

export type PaymentFrequency = "monthly" | "quarterly" | "half-yearly" | "yearly";
export type InvoiceStatus = "upcoming" | "pending" | "partially_paid" | "paid" | "overdue" | "waived" | "cancelled";
export type PaymentMode = "Cash" | "UPI" | "Bank Transfer" | "Online" | "Cheque";

export interface FeeProfile {
  studentId: string;
  monthlyFee: number;
  paymentFrequency: PaymentFrequency;
  preferredDueDate: number; // Day of month (1-28)
  feeStartDate: string; // ISO date
  admissionDate?: string; // ISO date
  lateFeeRule: {
    type: "flat" | "per_day" | "percentage" | "none";
    amount: number;
    gracePeriodDays: number;
  };
  discounts: {
    reason: string;
    amount: number;
    isPercentage: boolean;
  }[];
  isActive: boolean;
}

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  studentId: string;
  month: string; // YYYY-MM
  issueDate: string; // ISO date
  dueDate: string; // ISO date
  baseAmount: number;
  discountAmount: number;
  lateFeeAmount: number;
  previousBalance: number;
  totalAmount: number;
  amountPaid: number;
  status: InvoiceStatus;
  items: { description: string; amount: number }[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  studentId: string; // For easy querying
  amount: number;
  paymentDate: string; // ISO date
  mode: PaymentMode;
  referenceNumber?: string;
  receiptUrl?: string;
  recordedBy: string; // Teacher ID
  verifierName?: string; // Printed name of verifier
  status: "verified" | "pending_verification" | "student_paid" | "rejected";
  remark?: string;
}

export interface FeeState {
  feeProfiles: FeeProfile[];
  invoices: Invoice[];
  payments: Payment[];
  isInitialized: boolean;
  _hasHydrated: boolean;

  // Actions
  initializeFeeListeners: () => () => void;
  initializeMockData: () => Promise<void>;
  runDailyFeeEngine: () => Promise<void>; // Calculates late fees, auto-generates invoices
  
  // Queries
  getStudentFeeProfile: (studentId: string) => FeeProfile | undefined;
  getStudentInvoices: (studentId: string) => Invoice[];
  getStudentPayments: (studentId: string) => Payment[];
  getTeacherDashboardStats: (monthStr?: string, activeStudentIds?: string[]) => {
    expectedRevenue: number;
    collectedRevenue: number;
    pendingRevenue: number;
    overdueStudentsCount: number;
    pendingVerificationsCount: number;
  };
  
  // Mutations
  submitPayment: (invoiceId: string, amount: number, mode: PaymentMode, referenceNumber?: string) => Promise<string>;
  requestReceipt: (paymentId: string) => Promise<void>;
  verifyPayment: (paymentId: string, paymentDate: string, recordedBy: string, paymentMode: PaymentMode, remark?: string, amountReceived?: number, verifierName?: string) => Promise<void>;
  rejectPayment: (paymentId: string, remark?: string) => Promise<void>;
  recordPayment: (invoiceId: string, amount: number, mode: PaymentMode, recordedBy: string, referenceNumber?: string) => Promise<string | undefined>;
  undoPayment: (invoiceId: string) => Promise<void>;
  waiveInvoice: (invoiceId: string) => Promise<void>;
  updateFeeProfile: (profile: FeeProfile) => Promise<void>;
  purgeStudentFees: (studentId: string) => Promise<void>;
  remindStudent: (studentId: string, amount: number, dueDate: string) => void;
}

// ==========================================
// STORE
// ==========================================

export const useFeeStore = create<FeeState>()((set, get) => ({
  feeProfiles: [],
  invoices: [],
  payments: [],
  isInitialized: false,
  _hasHydrated: false,

  initializeFeeListeners: () => {
    const unsubProfiles = onSnapshot(collection(db, "feeProfiles"), (snapshot) => {
      const profiles = snapshot.docs.map(doc => doc.data() as FeeProfile);
      set({ feeProfiles: profiles, _hasHydrated: true });
    });

    const unsubInvoices = onSnapshot(collection(db, "invoices"), (snapshot) => {
      const invoices = snapshot.docs.map(doc => doc.data() as Invoice);
      set({ invoices });
    });

    const unsubPayments = onSnapshot(collection(db, "payments"), (snapshot) => {
      const payments = snapshot.docs.map(doc => doc.data() as Payment);
      set({ payments });
    });

    return () => {
      unsubProfiles();
      unsubInvoices();
      unsubPayments();
    };
  },

  initializeMockData: async () => {
    if (get().isInitialized) return;

    // Students lack permission to query all feeProfiles, bypass mock data generation for them
    const { useAuthStore } = await import("./authStore");
    const currentUser = useAuthStore.getState().currentUser;
    if (currentUser?.role === "student") {
      set({ isInitialized: true });
      return;
    }

    // Check if we already have data in Firestore
    const snapshot = await getDocs(collection(db, "feeProfiles"));
    if (!snapshot.empty) {
      set({ isInitialized: true });
      return;
    }

    const usersSnapshot = await getDocs(collection(db, "users"));
    const students = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter(u => u.role === "student");
    
    if (students.length === 0) {
      // Don't set isInitialized = true, so we can retry later if students are added
      return;
    }

    const batch = writeBatch(db);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    students.forEach((student, index) => {
      // 1. Create Profile
      const createdDate = new Date(student.createdAt);
      const joinDay = createdDate.getDate();
      
      const profile: FeeProfile = {
        studentId: student.id,
        monthlyFee: index % 2 === 0 ? 5000 : 7500,
        paymentFrequency: "monthly",
        preferredDueDate: joinDay > 28 ? 28 : joinDay,
        feeStartDate: student.createdAt,
        lateFeeRule: { type: "per_day", amount: 50, gracePeriodDays: 3 },
        discounts: index === 1 ? [{ reason: "Sibling", amount: 10, isPercentage: true }] : [],
        isActive: true,
      };
      batch.set(doc(db, "feeProfiles", profile.studentId), profile);

      const baseAmount = profile.monthlyFee;
      const discountAmount = profile.discounts.reduce((acc, curr) => curr.isPercentage ? acc + (baseAmount * curr.amount / 100) : acc + curr.amount, 0);
      const finalMonthlyAmount = baseAmount - discountAmount;

      const isTes001 = student.username === "tes001" || student.username === "Tes001";

      // 2. Create Previous Month Invoice
      const prevInvoiceId = `inv_${student.id}_${prevMonthYear}_${prevMonth}`;
      const prevInvoice: Invoice = {
        id: prevInvoiceId,
        studentId: student.id,
        month: `${prevMonthYear}-${prevMonth.toString().padStart(2, '0')}`,
        issueDate: new Date(prevMonthYear, prevMonth - 1, profile.preferredDueDate).toISOString(),
        dueDate: new Date(prevMonthYear, prevMonth - 1, profile.preferredDueDate).toISOString(),
        baseAmount,
        discountAmount,
        lateFeeAmount: 0,
        previousBalance: 0,
        totalAmount: finalMonthlyAmount,
        amountPaid: isTes001 ? 0 : finalMonthlyAmount,
        status: isTes001 ? "pending" : "paid",
        items: [{ description: "Monthly Tuition Fee", amount: baseAmount }],
      };
      batch.set(doc(db, "invoices", prevInvoice.id), prevInvoice);

      // 3. Create Payment for Previous Month
      if (!isTes001) {
        const prevPayId = `pay_${prevInvoiceId}`;
        const prevPayment: Payment = {
          id: prevPayId,
          invoiceId: prevInvoiceId,
          studentId: student.id,
          amount: finalMonthlyAmount,
          paymentDate: new Date(prevMonthYear, prevMonth - 1, profile.preferredDueDate + 2).toISOString(),
          mode: index % 2 === 0 ? "UPI" : "Bank Transfer",
          referenceNumber: `TXN${Math.random().toString().slice(2, 10)}`,
          recordedBy: "t_teacher1",
          status: "verified",
        };
        batch.set(doc(db, "payments", prevPayment.id), prevPayment);
      }

      // 4. Create Current Month Invoice
      const currInvoiceId = `inv_${student.id}_${currentYear}_${currentMonth}`;
      const isPaidThisMonth = isTes001 ? false : index % 3 === 0;
      const isOverdue = index % 3 === 1;

      let previousBalance = 0;
      if (isOverdue) {
        previousBalance = finalMonthlyAmount; 
      }

      const currInvoice: Invoice = {
        id: currInvoiceId,
        studentId: student.id,
        month: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`,
        issueDate: new Date(currentYear, currentMonth - 1, profile.preferredDueDate).toISOString(),
        dueDate: new Date(currentYear, currentMonth - 1, profile.preferredDueDate).toISOString(), 
        baseAmount,
        discountAmount,
        lateFeeAmount: 0,
        previousBalance,
        totalAmount: finalMonthlyAmount + previousBalance,
        amountPaid: isPaidThisMonth ? finalMonthlyAmount : 0,
        status: isPaidThisMonth ? "paid" : "pending",
        items: [{ description: "Monthly Tuition Fee", amount: baseAmount }],
      };
      batch.set(doc(db, "invoices", currInvoice.id), currInvoice);

      if (isPaidThisMonth) {
         const currPayId = `pay_${currInvoiceId}`;
         const currPayment: Payment = {
          id: currPayId,
          invoiceId: currInvoiceId,
          studentId: student.id,
          amount: finalMonthlyAmount,
          paymentDate: new Date(currentYear, currentMonth - 1, 2).toISOString(),
          mode: "UPI",
          referenceNumber: `TXN${Math.random().toString().slice(2, 10)}`,
          recordedBy: "t_teacher1",
          status: "verified",
        };
        batch.set(doc(db, "payments", currPayment.id), currPayment);
      }
    });

    await batch.commit();
    set({ isInitialized: true });
  },

  runDailyFeeEngine: async () => {
    const { invoices, feeProfiles } = get();
    const now = new Date();
    const batch = writeBatch(db);
    let hasChanges = false;

    // 1. Calculate Late Fees
    invoices.forEach(inv => {
      if (inv.status === "pending" || inv.status === "partially_paid") {
        const dueDate = new Date(inv.dueDate);
        const profile = feeProfiles.find(p => p.studentId === inv.studentId);
        
        if (profile && profile.lateFeeRule.type !== "none") {
          const graceDate = new Date(dueDate);
          graceDate.setDate(graceDate.getDate() + profile.lateFeeRule.gracePeriodDays);

          if (now > graceDate) {
            const daysLate = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
            let newLateFee = 0;
            
            if (profile.lateFeeRule.type === "flat") newLateFee = profile.lateFeeRule.amount;
            if (profile.lateFeeRule.type === "per_day") newLateFee = profile.lateFeeRule.amount * daysLate;
            if (profile.lateFeeRule.type === "percentage") newLateFee = (inv.totalAmount - inv.lateFeeAmount) * (profile.lateFeeRule.amount / 100);

            if (newLateFee !== inv.lateFeeAmount) {
              const totalAmount = inv.baseAmount - inv.discountAmount + inv.previousBalance + newLateFee;
              batch.update(doc(db, "invoices", inv.id), {
                lateFeeAmount: newLateFee,
                totalAmount,
                status: "overdue"
              });
              hasChanges = true;
            }
          }
        }
      }
    });

    // 2. Generate Invoices for current month if missing
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    feeProfiles.filter(p => p.isActive).forEach(profile => {
      const billingDateThisMonth = new Date(currentYear, currentMonth - 1, profile.preferredDueDate);
      const hasAnyInvoice = invoices.some(i => i.studentId === profile.studentId);
      
      if (now >= billingDateThisMonth || !hasAnyInvoice) {
        const hasCurrentInvoice = invoices.some(i => i.studentId === profile.studentId && i.month === currentMonthStr);
        
        if (!hasCurrentInvoice) {
          const baseAmount = profile.monthlyFee;
          const discountAmount = profile.discounts.reduce((acc, curr) => curr.isPercentage ? acc + (baseAmount * curr.amount / 100) : acc + curr.amount, 0);
          const finalAmount = baseAmount - discountAmount;
          
          const previousInvoices = invoices.filter(
            i => i.studentId === profile.studentId && 
            i.month !== currentMonthStr && 
            (i.status === "pending" || i.status === "overdue" || i.status === "partially_paid")
          );
          
          let previousBalance = 0;
          previousInvoices.forEach(inv => {
            previousBalance += (inv.totalAmount - inv.amountPaid);
            batch.update(doc(db, "invoices", inv.id), { status: "cancelled" });
          });
          
          const newInvId = `inv_${profile.studentId}_${currentYear}_${currentMonth}_${Date.now()}`;
          const newInvoice: Invoice = {
            id: newInvId,
            studentId: profile.studentId,
            month: currentMonthStr,
            issueDate: billingDateThisMonth.toISOString(),
            dueDate: billingDateThisMonth.toISOString(),
            baseAmount,
            discountAmount,
            lateFeeAmount: 0,
            previousBalance,
            totalAmount: finalAmount + previousBalance,
            amountPaid: 0,
            status: "pending",
            items: [{ description: "Monthly Tuition Fee", amount: baseAmount }],
          };
          batch.set(doc(db, "invoices", newInvoice.id), newInvoice);
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      await batch.commit();
    }
    
    // 3. Send Notifications for Invoices Due in 5 days
    import('./notificationStore').then(({ useNotificationStore }) => {
      const notifications = useNotificationStore.getState().notifications;
      invoices.forEach(inv => {
        if (inv.status === "pending" || inv.status === "partially_paid") {
          const dueDate = new Date(inv.dueDate);
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
          
          if (daysUntilDue === 5) {
            const alreadySent = notifications.some(n => 
              n.recipientId === inv.studentId && 
              n.title === "Upcoming Fee Reminder" && 
              (now.getTime() - new Date(n.createdAt).getTime() < 24 * 3600 * 1000)
            );
            
            if (!alreadySent) {
              useNotificationStore.getState().addNotification({
                recipientId: inv.studentId,
                title: "Upcoming Fee Reminder",
                message: `Your fee of ₹${inv.totalAmount - inv.amountPaid} is due in 5 days on ${dueDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}.`,
                link: '/dashboard/student/fees'
              });
            }
          }
        }
      });
    });
  },

  getStudentFeeProfile: (studentId) => {
    return get().feeProfiles.find(p => p.studentId === studentId);
  },

  getStudentInvoices: (studentId) => {
    return get().invoices.filter(i => i.studentId === studentId).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  },

  getStudentPayments: (studentId) => {
    return get().payments.filter(p => p.studentId === studentId).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  },

  getTeacherDashboardStats: (monthStr?: string, activeStudentIds?: string[]) => {
    const { invoices, payments } = get();
    
    let targetMonth = monthStr;
    if (!targetMonth) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      targetMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    }
    
    let currentInvoices = invoices.filter(i => i.month === targetMonth);
    
    if (activeStudentIds) {
      currentInvoices = currentInvoices.filter(i => activeStudentIds.includes(i.studentId));
    }
    
    let expectedRevenue = 0;
    let collectedRevenue = 0;
    let pendingRevenue = 0;
    let overdueStudentsCount = 0;
    
    const overdueSet = new Set<string>();

    currentInvoices.forEach(inv => {
      expectedRevenue += inv.totalAmount;
      collectedRevenue += inv.amountPaid;
      pendingRevenue += Math.max(0, inv.totalAmount - inv.amountPaid);
      
      if (inv.status === "overdue" && (inv.totalAmount - inv.amountPaid) > 0) {
        overdueSet.add(inv.studentId);
      }
    });

    const pendingVerificationsCount = payments.filter(p => p.status === "pending_verification").length;

    return {
      expectedRevenue,
      collectedRevenue,
      pendingRevenue,
      overdueStudentsCount: overdueSet.size,
      pendingVerificationsCount
    };
  },

  submitPayment: async (invoiceId, amount, mode, referenceNumber) => {
    const invoice = get().invoices.find(i => i.id === invoiceId);
    if (!invoice) return "";

    const newPaymentId = `pay_${Date.now()}`;
    const newPayment: Payment = {
      id: newPaymentId,
      invoiceId,
      studentId: invoice.studentId,
      amount,
      paymentDate: new Date().toISOString(),
      mode,
      referenceNumber,
      recordedBy: "student",
      status: "pending_verification",
    };
    
    await setDoc(doc(db, "payments", newPaymentId), newPayment);

    import('./authStore').then(({ useAuthStore }) => {
      const student = useAuthStore.getState().getAllUsers().find(u => u.id === invoice.studentId);
      const studentName = student ? student.name : "A student";
      import('./notificationStore').then(({ useNotificationStore }) => {
        useNotificationStore.getState().addNotification({
          recipientId: 'all_teachers',
          title: "Fee Verification Request",
          message: `${studentName} has declared a fee payment and is waiting for your verification.`,
          link: '/dashboard/teacher/fees'
        });
      });
    });

    return newPaymentId;
  },

  requestReceipt: async (paymentId) => {
    await updateDoc(doc(db, "payments", paymentId), { status: "pending_verification" });

    import('./notificationStore').then(({ useNotificationStore }) => {
      useNotificationStore.getState().addNotification({
        recipientId: 'all_teachers',
        title: "Receipt Request",
        message: `A student has requested a fee receipt and is waiting for your verification.`,
        link: '/dashboard/teacher/fees'
      });
    });
  },

  verifyPayment: async (paymentId, paymentDate, recordedBy, paymentMode, remark, amountReceived?: number, verifierName?: string) => {
    const { invoices, payments } = get();
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;
    
    const finalAmount = amountReceived !== undefined ? amountReceived : payment.amount;
    const batch = writeBatch(db);
    
    batch.update(doc(db, "payments", paymentId), {
      status: "verified",
      recordedBy,
      verifierName: verifierName || "",
      mode: paymentMode,
      paymentDate,
      remark: remark || "",
      amount: finalAmount
    });
    
    const invoice = invoices.find(i => i.id === payment.invoiceId);
    if (!invoice) return;
    
    const newAmountPaid = invoice.amountPaid + finalAmount;
    let newStatus = invoice.status;
    
    if (newAmountPaid >= invoice.totalAmount) {
      newStatus = "paid";
    } else if (newAmountPaid > 0) {
      newStatus = "partially_paid";
    }
    
    batch.update(doc(db, "invoices", invoice.id), {
      amountPaid: newAmountPaid,
      status: newStatus
    });
    
    const currentMonthDate = new Date(invoice.month);
    const nextMonthDate = new Date(currentMonthDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonthStr = nextMonthDate.toISOString().substring(0, 7);
    
    const nextDueDate = new Date(invoice.dueDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    
    const nextInvoiceExists = invoices.some(i => i.studentId === invoice.studentId && i.month === nextMonthStr);
    
    if (!nextInvoiceExists) {
      const profile = get().feeProfiles.find(p => p.studentId === invoice.studentId);
      if (profile) {
         const baseAmount = profile.monthlyFee;
         let discountAmount = 0;
         profile.discounts.forEach(d => {
           if (d.isPercentage) {
             discountAmount += (baseAmount * d.amount) / 100;
           } else {
             discountAmount += d.amount;
           }
         });
         
         const previousBalance = Math.max(0, invoice.totalAmount - newAmountPaid);
         
         const newInvId = `inv_${Date.now()}`;
         const nextInvoice: Invoice = {
           id: newInvId,
           studentId: invoice.studentId,
           month: nextMonthStr,
           issueDate: new Date().toISOString(),
           dueDate: nextDueDate.toISOString(),
           baseAmount,
           discountAmount,
           lateFeeAmount: 0,
           previousBalance,
           totalAmount: baseAmount - discountAmount + previousBalance,
           amountPaid: 0,
           status: "pending" as InvoiceStatus,
           items: [
             { description: "Monthly Tuition Fee", amount: baseAmount },
             ...(previousBalance > 0 ? [{ description: "Previous Balance", amount: previousBalance }] : [])
           ]
         };
         batch.set(doc(db, "invoices", newInvId), nextInvoice);
      }
    }
    
    await batch.commit();

    import('./notificationStore').then(({ useNotificationStore }) => {
      useNotificationStore.getState().addNotification({
        recipientId: payment.studentId,
        title: "Receipt Ready",
        message: `Your payment of ₹${finalAmount} has been verified and your receipt is ready.`,
        link: '/dashboard/student/fees'
      });
    });
  },

  rejectPayment: async (paymentId, remark) => {
    const payment = get().payments.find(p => p.id === paymentId);
    if (!payment) return;
    
    await updateDoc(doc(db, "payments", paymentId), {
      status: "rejected",
      remark: remark || ""
    });

    import('./notificationStore').then(({ useNotificationStore }) => {
      useNotificationStore.getState().addNotification({
        recipientId: payment.studentId,
        title: "Receipt Request Rejected",
        message: `Your request for the receipt is rejected, kindly contact the teacher.`,
        link: '/dashboard/student/fees'
      });
    });
  },

  remindStudent: (studentId, amount, dueDate) => {
    import('./notificationStore').then(({ useNotificationStore }) => {
      useNotificationStore.getState().addNotification({
        recipientId: studentId,
        title: "Fee Reminder",
        message: `Your due date is ${dueDate}, kindly clear the fees of ₹${amount}.`,
        link: '/dashboard/student/fees'
      });
    });
  },

  recordPayment: async (invoiceId, amount, mode, recordedBy, referenceNumber) => {
    const invoice = get().invoices.find(i => i.id === invoiceId);
    if (!invoice) return undefined;
    
    const batch = writeBatch(db);
    
    const newAmountPaid = invoice.amountPaid + amount;
    let newStatus = invoice.status;
    if (newAmountPaid >= invoice.totalAmount) {
      newStatus = "paid";
    } else if (newAmountPaid > 0) {
      newStatus = "partially_paid";
    }
    
    batch.update(doc(db, "invoices", invoiceId), {
      amountPaid: newAmountPaid,
      status: newStatus
    });
    
    const newPaymentId = `pay_${Date.now()}`;
    const newPayment: Payment = {
      id: newPaymentId,
      invoiceId,
      studentId: invoice.studentId,
      amount,
      paymentDate: new Date().toISOString(),
      mode,
      referenceNumber,
      recordedBy,
      status: "verified",
    };
    
    batch.set(doc(db, "payments", newPaymentId), newPayment);
    
    await batch.commit();

    if (typeof window !== "undefined") {
      const notificationPayload = {
        id: `fee_verified_${newPayment.id}`,
        title: "Fee Payment Verified ✅",
        body: "Your fee payment has been verified. Your receipt is ready to download."
      };
      localStorage.setItem(`manual_fee_reminder_${invoice.studentId}`, JSON.stringify(notificationPayload));
    }
  },

  undoPayment: async (invoiceId) => {
    const { invoices, payments } = get();
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    
    const batch = writeBatch(db);
    
    const invoicePayments = payments.filter(p => p.invoiceId === invoiceId);
    invoicePayments.forEach(p => {
      batch.delete(doc(db, "payments", p.id));
    });
    
    const now = new Date();
    const dueDate = new Date(invoice.dueDate);
    const newStatus = now > dueDate ? "overdue" : "pending";
    
    batch.update(doc(db, "invoices", invoiceId), {
      amountPaid: 0,
      status: newStatus
    });
    
    await batch.commit();
  },

  waiveInvoice: async (invoiceId) => {
    await updateDoc(doc(db, "invoices", invoiceId), {
      status: "waived",
      totalAmount: 0
    });
  },
  
  purgeStudentFees: async (studentId) => {
    const { feeProfiles, invoices, payments } = get();
    const batch = writeBatch(db);
    
    const profile = feeProfiles.find(p => p.studentId === studentId);
    if (profile) batch.delete(doc(db, "feeProfiles", studentId));
    
    invoices.filter(i => i.studentId === studentId).forEach(i => {
      batch.delete(doc(db, "invoices", i.id));
    });
    
    payments.filter(p => p.studentId === studentId).forEach(p => {
      batch.delete(doc(db, "payments", p.id));
    });
    
    await batch.commit();
  },

  updateFeeProfile: async (profile) => {
    const batch = writeBatch(db);
    batch.set(doc(db, "feeProfiles", profile.studentId), profile);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    const { invoices } = get();
    const hasCurrentInvoice = invoices.some(i => i.studentId === profile.studentId && i.month === currentMonthStr);
    
    if (!hasCurrentInvoice) {
      const baseAmount = profile.monthlyFee;
      let discountAmount = 0;
      profile.discounts?.forEach(d => {
        if (d.isPercentage) discountAmount += (baseAmount * d.amount) / 100;
        else discountAmount += d.amount;
      });
      
      const newInvId = `inv_${profile.studentId}_${currentYear}_${currentMonth}_${Date.now()}`;
      const newInvoice: Invoice = {
        id: newInvId,
        studentId: profile.studentId,
        month: currentMonthStr,
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        baseAmount,
        discountAmount,
        lateFeeAmount: 0,
        previousBalance: 0,
        totalAmount: baseAmount - discountAmount,
        amountPaid: 0,
        status: "pending",
        items: [{ description: "Monthly Tuition Fee", amount: baseAmount }]
      };
      batch.set(doc(db, "invoices", newInvId), newInvoice);
    }

    await batch.commit();
  }

}));

