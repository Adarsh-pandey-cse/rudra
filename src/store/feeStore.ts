import { create } from "zustand";

import { useAuthStore } from "./authStore";
// import { receiptService } from "@/lib/firebase/receiptService";

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
  studentId: string;
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

interface FeeState {
  feeProfiles: FeeProfile[];
  invoices: Invoice[];
  payments: Payment[];
  isInitialized: boolean;

  // Actions
  initializeMockData: () => void;
  runDailyFeeEngine: () => void;
  
  // Queries
  getStudentFeeProfile: (studentId: string) => FeeProfile | undefined;
  getStudentInvoices: (studentId: string) => Invoice[];
  getStudentPayments: (studentId: string) => Payment[];
  getTeacherDashboardStats: (monthStr?: string) => {
    expectedRevenue: number;
    collectedRevenue: number;
    pendingRevenue: number;
    overdueStudentsCount: number;
  };
  
  // Mutations
  submitPayment: (invoiceId: string, amount: number, mode: PaymentMode, referenceNumber?: string) => string;
  requestReceipt: (paymentId: string) => void;
  verifyPayment: (paymentId: string, paymentDate: string, recordedBy: string, paymentMode: PaymentMode, remark?: string, amountReceived?: number, verifierName?: string) => void;
  rejectPayment: (paymentId: string, remark?: string) => void;
  recordPayment: (invoiceId: string, amount: number, mode: PaymentMode, recordedBy: string, referenceNumber?: string) => void;
  undoPayment: (invoiceId: string) => void;
  waiveInvoice: (invoiceId: string) => void;
  updateFeeProfile: (profile: FeeProfile) => void;
  purgeStudentFees: (studentId: string) => void;
}

// ==========================================
// STORE
// ==========================================

export const useFeeStore = create<FeeState>()((set, get) => ({
      feeProfiles: [],
      invoices: [],
      payments: [],
      isInitialized: false,

      initializeMockData: () => {
        if (get().isInitialized) return;

        // Fetch students from authStore to link properly
        const allUsers = useAuthStore.getState().getAllUsers();
        const students = allUsers.filter(u => u.role === "student");
        
        if (students.length === 0) return;

        const profiles: FeeProfile[] = [];
        const invoices: Invoice[] = [];
        const payments: Payment[] = [];

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // 1-12
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

        // Generate data for each student
        students.forEach((student, index) => {
          // 1. Create Profile
          const createdDate = new Date(student.createdAt);
          const joinDay = createdDate.getDate();
          
          const profile: FeeProfile = {
            studentId: student.id,
            monthlyFee: index % 2 === 0 ? 5000 : 7500, // Vary fees
            paymentFrequency: "monthly",
            preferredDueDate: joinDay > 28 ? 28 : joinDay, // Use joining day as billing day
            feeStartDate: student.createdAt,
            lateFeeRule: { type: "per_day", amount: 50, gracePeriodDays: 3 },
            discounts: index === 1 ? [{ reason: "Sibling", amount: 10, isPercentage: true }] : [],
            isActive: true,
          };
          profiles.push(profile);

          const baseAmount = profile.monthlyFee;
          const discountAmount = profile.discounts.reduce((acc, curr) => curr.isPercentage ? acc + (baseAmount * curr.amount / 100) : acc + curr.amount, 0);
          const finalMonthlyAmount = baseAmount - discountAmount;

          // 2. Create Previous Month Invoice (PAID)
          const prevInvoiceId = `inv_${student.id}_${prevMonthYear}_${prevMonth}`;
          invoices.push({
            id: prevInvoiceId,
            studentId: student.id,
            month: `${prevMonthYear}-${prevMonth.toString().padStart(2, '0')}`,
            issueDate: new Date(prevMonthYear, prevMonth - 1, profile.preferredDueDate).toISOString(),
            dueDate: new Date(prevMonthYear, prevMonth - 1, profile.preferredDueDate).toISOString(), // Due on billing day
            baseAmount,
            discountAmount,
            lateFeeAmount: 0,
            previousBalance: 0,
            totalAmount: finalMonthlyAmount,
            amountPaid: finalMonthlyAmount,
            status: "paid",
            items: [{ description: "Monthly Tuition Fee", amount: baseAmount }],
          });

          // 3. Create Payment for Previous Month
          const prevPayId = `pay_${prevInvoiceId}`;
          payments.push({
            id: prevPayId,
            invoiceId: prevInvoiceId,
            studentId: student.id,
            amount: finalMonthlyAmount,
            paymentDate: new Date(prevMonthYear, prevMonth - 1, profile.preferredDueDate + 2).toISOString(),
            mode: index % 2 === 0 ? "UPI" : "Bank Transfer",
            referenceNumber: `TXN${Math.random().toString().slice(2, 10)}`,
            recordedBy: "t_teacher1",
            status: "verified",
          });

          // 4. Create Current Month Invoice
          const currInvoiceId = `inv_${student.id}_${currentYear}_${currentMonth}`;
          const isPaidThisMonth = index % 3 === 0;
          const isOverdue = index % 3 === 1; // Previous month was not paid

          // Consolidate past debt if overdue
          let previousBalance = 0;
          if (isOverdue) {
            previousBalance = finalMonthlyAmount; // e.g. 500
          }

          invoices.push({
            id: currInvoiceId,
            studentId: student.id,
            month: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`,
            issueDate: new Date(currentYear, currentMonth - 1, profile.preferredDueDate).toISOString(),
            dueDate: new Date(currentYear, currentMonth - 1, profile.preferredDueDate).toISOString(), 
            baseAmount,
            discountAmount,
            lateFeeAmount: 0, // Mock late fee handled separately
            previousBalance,
            totalAmount: finalMonthlyAmount + previousBalance, // e.g. 500 + 500
            amountPaid: isPaidThisMonth ? finalMonthlyAmount : 0,
            status: isPaidThisMonth ? "paid" : "pending",
            items: [{ description: "Monthly Tuition Fee", amount: baseAmount }],
          });

          if (isPaidThisMonth) {
             const currPayId = `pay_${currInvoiceId}`;
             payments.push({
              id: currPayId,
              invoiceId: currInvoiceId,
              studentId: student.id,
              amount: finalMonthlyAmount,
              paymentDate: new Date(currentYear, currentMonth - 1, 2).toISOString(),
              mode: "UPI",
              referenceNumber: `TXN${Math.random().toString().slice(2, 10)}`,
              recordedBy: "t_teacher1",
              status: "verified",
            });
            // if (typeof window !== "undefined") receiptService.createReceiptRecord(currPayId, currInvoiceId, student.id, "t_teacher1").catch(console.error);
          }
        });

        set({ feeProfiles: profiles, invoices, payments, isInitialized: true });
      },

      runDailyFeeEngine: () => {
        // In a real backend, this runs on a cron job at midnight.
        // For the demo, we call it when the teacher dashboard mounts.
        const { invoices, feeProfiles } = get();
        const now = new Date();
        const updatedInvoices = [...invoices];
        let hasChanges = false;

        // 1. Calculate Late Fees
        updatedInvoices.forEach(inv => {
          if (inv.status === "pending" || inv.status === "partially_paid") {
            const dueDate = new Date(inv.dueDate);
            const profile = feeProfiles.find(p => p.studentId === inv.studentId);
            
            if (profile && profile.lateFeeRule.type !== "none") {
              const graceDate = new Date(dueDate);
              graceDate.setDate(graceDate.getDate() + profile.lateFeeRule.gracePeriodDays);

              if (now > graceDate) {
                // Apply late fee
                const daysLate = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
                let newLateFee = 0;
                
                if (profile.lateFeeRule.type === "flat") newLateFee = profile.lateFeeRule.amount;
                if (profile.lateFeeRule.type === "per_day") newLateFee = profile.lateFeeRule.amount * daysLate;
                if (profile.lateFeeRule.type === "percentage") newLateFee = (inv.totalAmount - inv.lateFeeAmount) * (profile.lateFeeRule.amount / 100);

                if (newLateFee !== inv.lateFeeAmount) {
                  inv.lateFeeAmount = newLateFee;
                  inv.totalAmount = inv.baseAmount - inv.discountAmount + inv.previousBalance + newLateFee;
                  inv.status = "overdue";
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
          // Has the billing anniversary passed in the current month?
          const billingDateThisMonth = new Date(currentYear, currentMonth - 1, profile.preferredDueDate);
          
          if (now >= billingDateThisMonth) {
            const hasCurrentInvoice = updatedInvoices.some(i => i.studentId === profile.studentId && i.month === currentMonthStr);
            
            if (!hasCurrentInvoice) {
              const baseAmount = profile.monthlyFee;
              const discountAmount = profile.discounts.reduce((acc, curr) => curr.isPercentage ? acc + (baseAmount * curr.amount / 100) : acc + curr.amount, 0);
              const finalAmount = baseAmount - discountAmount;
              
              // Calculate rollover from previous unpaid invoices
              const previousInvoices = updatedInvoices.filter(
                i => i.studentId === profile.studentId && 
                i.month !== currentMonthStr && 
                (i.status === "pending" || i.status === "overdue" || i.status === "partially_paid")
              );
              
              let previousBalance = 0;
              previousInvoices.forEach(inv => {
                previousBalance += (inv.totalAmount - inv.amountPaid);
                inv.status = "cancelled"; // Mark as cancelled so it doesn't double count. We roll it over.
                // In a real system, you might mark it as "carried_forward"
              });
              
              updatedInvoices.push({
                id: `inv_${profile.studentId}_${currentYear}_${currentMonth}_${Date.now()}`,
                studentId: profile.studentId,
                month: currentMonthStr,
                issueDate: billingDateThisMonth.toISOString(),
                dueDate: billingDateThisMonth.toISOString(), // Due immediately on the anniversary
                baseAmount,
                discountAmount,
                lateFeeAmount: 0,
                previousBalance,
                totalAmount: finalAmount + previousBalance,
                amountPaid: 0,
                status: "pending",
                items: [{ description: "Monthly Tuition Fee", amount: baseAmount }],
              });
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          set({ invoices: updatedInvoices });
        }
        
        // 3. Send Notifications for Invoices Due in 5 days
        import('./notificationStore').then(({ useNotificationStore }) => {
          const notifications = useNotificationStore.getState().notifications;
          updatedInvoices.forEach(inv => {
            if (inv.status === "pending" || inv.status === "partially_paid") {
              const dueDate = new Date(inv.dueDate);
              const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
              
              if (daysUntilDue === 5) {
                // Prevent spam if already sent in last 24h
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

      getTeacherDashboardStats: (monthStr?: string) => {
        const { invoices, payments } = get();
        
        let targetMonth = monthStr;
        if (!targetMonth) {
          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth() + 1;
          targetMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
        }
        
        // Filter invoices for target month
        const currentInvoices = invoices.filter(i => i.month === targetMonth);
        
        let expectedRevenue = 0;
        let collectedRevenue = 0;
        let pendingRevenue = 0;
        let overdueStudentsCount = 0;
        
        const overdueSet = new Set<string>();

        currentInvoices.forEach(inv => {
          expectedRevenue += inv.totalAmount;
          collectedRevenue += inv.amountPaid;
          pendingRevenue += (inv.totalAmount - inv.amountPaid);
          
          if (inv.status === "overdue") {
            overdueSet.add(inv.studentId);
          }
        });

        // Get count of pending verifications
        const pendingVerificationsCount = payments.filter(p => p.status === "pending_verification").length;

        return {
          expectedRevenue,
          collectedRevenue,
          pendingRevenue,
          overdueStudentsCount: overdueSet.size,
          pendingVerificationsCount
        };
      },

      submitPayment: (invoiceId, amount, mode, referenceNumber) => {
        const { invoices, payments } = get();
        const invoice = invoices.find(i => i.id === invoiceId);
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
          status: "pending_verification", // Immediately request verification
        };
        
        set({ payments: [...payments, newPayment] });

        // Trigger notification for teacher
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

      requestReceipt: (paymentId) => {
        const { payments } = get();
        const paymentIndex = payments.findIndex(p => p.id === paymentId);
        if (paymentIndex === -1) return;

        const payment = { ...payments[paymentIndex], status: "pending_verification" as const };
        const updatedPayments = [...payments];
        updatedPayments[paymentIndex] = payment;
        
        set({ payments: updatedPayments });

        // Trigger notification for teacher
        import('./notificationStore').then(({ useNotificationStore }) => {
          useNotificationStore.getState().addNotification({
            recipientId: 'all_teachers',
            title: "Receipt Request",
            message: `A student has requested a fee receipt and is waiting for your verification.`,
            link: '/dashboard/teacher/fees'
          });
        });
      },

      verifyPayment: (paymentId, paymentDate, recordedBy, paymentMode, remark, amountReceived?: number, verifierName?: string) => {
        const { invoices, payments } = get();
        const paymentIndex = payments.findIndex(p => p.id === paymentId);
        if (paymentIndex === -1) return;
        
        const finalAmount = amountReceived !== undefined ? amountReceived : payments[paymentIndex].amount;
        
        const payment = { ...payments[paymentIndex], status: "verified" as const, recordedBy, verifierName, mode: paymentMode, paymentDate, remark, amount: finalAmount };
        
        // Update Invoice
        const invoiceIndex = invoices.findIndex(i => i.id === payment.invoiceId);
        if (invoiceIndex === -1) return;
        
        const invoice = { ...invoices[invoiceIndex] };
        invoice.amountPaid += payment.amount;
        
        let nextInvoice = null;
        const balance = invoice.totalAmount - invoice.amountPaid;
        
        if (invoice.amountPaid >= invoice.totalAmount) {
          invoice.status = "paid";
        } else if (invoice.amountPaid > 0) {
          invoice.status = "partially_paid";
        }
        
        // Generate next month's invoice if payment is verified
        const currentMonthDate = new Date(invoice.month);
        const nextMonthDate = new Date(currentMonthDate);
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        
        const nextDueDate = new Date(invoice.dueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        
        // Check if next invoice already exists
        const nextInvoiceExists = invoices.some(i => i.studentId === invoice.studentId && i.month === nextMonthDate.toISOString().substring(0, 7));
        
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
             
             // Carry over the balance
             const previousBalance = Math.max(0, balance);
             
             nextInvoice = {
               id: `inv_${Date.now()}`,
               studentId: invoice.studentId,
               month: nextMonthDate.toISOString().substring(0, 7), // YYYY-MM
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
          }
        }
        
        const updatedInvoices = [...invoices];
        updatedInvoices[invoiceIndex] = invoice;
        if (nextInvoice) {
          updatedInvoices.push(nextInvoice);
        }
        
        const updatedPayments = [...payments];
        updatedPayments[paymentIndex] = payment;
        
        set({ invoices: updatedInvoices, payments: updatedPayments });

        // Trigger notification for student
        import('./notificationStore').then(({ useNotificationStore }) => {
          useNotificationStore.getState().addNotification({
            recipientId: payment.studentId,
            title: "Receipt Ready",
            message: `Your payment of ₹${payment.amount} has been verified and your receipt is ready.`,
            link: '/dashboard/student/fees'
          });
        });
      },

      rejectPayment: (paymentId, remark) => {
        const { payments } = get();
        const paymentIndex = payments.findIndex(p => p.id === paymentId);
        if (paymentIndex === -1) return;

        const payment = { ...payments[paymentIndex], status: "rejected" as const, remark };
        const updatedPayments = [...payments];
        updatedPayments[paymentIndex] = payment;

        set({ payments: updatedPayments });

        // Trigger notification for student
        import('./notificationStore').then(({ useNotificationStore }) => {
          useNotificationStore.getState().addNotification({
            recipientId: payment.studentId,
            title: "Fees Receipt Request Rejected",
            message: `Your payment verification failed. Kindly contact the teacher if you have paid the fees.`,
            link: '/dashboard/student/fees'
          });
        });
      },

      recordPayment: (invoiceId, amount, mode, recordedBy, referenceNumber) => {
        const { invoices, payments } = get();
        
        const invoiceIndex = invoices.findIndex(i => i.id === invoiceId);
        if (invoiceIndex === -1) return;
        
        const invoice = { ...invoices[invoiceIndex] };
        
        // Update Invoice
        invoice.amountPaid += amount;
        if (invoice.amountPaid >= invoice.totalAmount) {
          invoice.status = "paid";
        } else if (invoice.amountPaid > 0) {
          invoice.status = "partially_paid";
        }
        
        const updatedInvoices = [...invoices];
        updatedInvoices[invoiceIndex] = invoice;
        
        // Create Payment Record
        const newPayment: Payment = {
          id: `pay_${Date.now()}`,
          invoiceId,
          studentId: invoice.studentId,
          amount,
          paymentDate: new Date().toISOString(),
          mode,
          referenceNumber,
          recordedBy,
          status: "verified",
        };
        
        set({ invoices: updatedInvoices, payments: [...payments, newPayment] });

        // Generate receipt and trigger notification
        if (typeof window !== "undefined") {
          // if (typeof window !== "undefined") receiptService.createReceiptRecord(newPayment.id, invoiceId, invoice.studentId, recordedBy).catch(console.error);
          
          const notificationPayload = {
            id: `fee_verified_${newPayment.id}`,
            title: "Fee Payment Verified ✅",
            body: "Your fee payment has been verified. Your receipt is ready to download."
          };
          localStorage.setItem(`manual_fee_reminder_${invoice.studentId}`, JSON.stringify(notificationPayload));
        }
      },

      undoPayment: (invoiceId) => {
        const { invoices, payments } = get();
        
        // Find invoice
        const invoiceIndex = invoices.findIndex(i => i.id === invoiceId);
        if (invoiceIndex === -1) return;
        
        // Remove all payments linked to this invoice
        const updatedPayments = payments.filter(p => p.invoiceId !== invoiceId);
        
        // Revert invoice status and amountPaid
        const invoice = { ...invoices[invoiceIndex] };
        invoice.amountPaid = 0;
        
        // Check if overdue
        const now = new Date();
        const dueDate = new Date(invoice.dueDate);
        invoice.status = now > dueDate ? "overdue" : "pending";
        
        const updatedInvoices = [...invoices];
        updatedInvoices[invoiceIndex] = invoice;
        
        set({ invoices: updatedInvoices, payments: updatedPayments });
      },

      waiveInvoice: (invoiceId) => {
        const { invoices } = get();
        const updatedInvoices = invoices.map(inv => {
          if (inv.id === invoiceId) {
            return { ...inv, status: "waived" as InvoiceStatus, totalAmount: 0 };
          }
          return inv;
        });
        set({ invoices: updatedInvoices });
      },
      
      purgeStudentFees: (studentId) => {
        set(state => ({
          feeProfiles: state.feeProfiles.filter(p => p.studentId !== studentId),
          invoices: state.invoices.filter(i => i.studentId !== studentId),
          payments: state.payments.filter(p => p.studentId !== studentId)
        }));
      },

      updateFeeProfile: (profile) => {
        const { feeProfiles } = get();
        const updated = feeProfiles.map(p => p.studentId === profile.studentId ? profile : p);
        if (!updated.find(p => p.studentId === profile.studentId)) {
          updated.push(profile);
        }
        set({ feeProfiles: updated });
      }

}));
