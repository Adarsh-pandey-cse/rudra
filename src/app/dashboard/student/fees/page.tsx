"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { 
  Receipt, CreditCard, IndianRupee, Download, 
  Clock, CheckCircle2, AlertTriangle, Calendar
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { useFeeStore, Invoice, Payment } from "@/store/feeStore";
import { receiptService, ReceiptRecord } from "@/lib/firebase/receiptService";
import { Student } from "@/types";
import { useNotificationStore } from "@/store/notificationStore";
import { FeeReceiptModal } from "@/components/receipts/FeeReceiptModal";
import { FeeReceiptData } from "@/components/receipts/FeeReceiptTemplate";

import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const containerVariants: Variants = { 
  hidden: { opacity: 0 }, 
  show: { opacity: 1, transition: { staggerChildren: 0.06 } } 
};

const itemVariants: Variants = { 
  hidden: { opacity: 0, y: 16 }, 
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } 
};

export default function StudentFeesPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const { 
    isInitialized, initializeMockData, runDailyFeeEngine, getStudentInvoices, getStudentPayments, submitPayment, requestReceipt, getStudentFeeProfile,
    invoices: storeInvoices, payments: storePayments
  } = useFeeStore();

  const [mounted, setMounted] = useState(false);
  const [activeReceiptData, setActiveReceiptData] = useState<{payment: Payment, invoice: Invoice, record: ReceiptRecord} | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "student") {
      // router.replace("/auth/login"); /* Handled by DashboardLayout */
      return;
    }
    initializeMockData();
    runDailyFeeEngine();
    setMounted(true);
  }, [isAuthenticated, currentUser, router, initializeMockData, runDailyFeeEngine, _hasHydrated]);

  const { invoices, payments, currentInvoice } = useMemo(() => {
    if (!isInitialized || !currentUser) return { invoices: [], payments: [], currentInvoice: null };
    
    const inv = getStudentInvoices(currentUser.id);
    const pay = getStudentPayments(currentUser.id);
    
    // Filter out future invoices that are more than 7 days away (unless already paid)
    const visibleInv = inv.filter(i => {
      if (i.status === "paid") return true;
      const daysUntilDue = (new Date(i.dueDate).getTime() - Date.now()) / (1000 * 3600 * 24);
      return daysUntilDue <= 7;
    });
    
    // Sort invoices by date (oldest first)
    const sorted = [...visibleInv].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    // The display invoice is the first unpaid invoice. If all paid, it's the latest one.
    const current = sorted.find(i => i.status !== "paid") || sorted[sorted.length - 1] || null;

    return { invoices: visibleInv, payments: pay, currentInvoice: current };
  }, [isInitialized, currentUser, getStudentInvoices, getStudentPayments, storeInvoices, storePayments]);

  const feeProfile = currentUser ? getStudentFeeProfile(currentUser.id) : null;

  const handleDownloadClick = async (payment: Payment, invoice: Invoice) => {
    if (!currentUser || currentUser.role !== "student") return;
    setIsLoadingReceipt(payment.id);
    
    // First, check if receipt exists
    let record = null;
    try {
      record = await receiptService.getReceiptByPaymentId(payment.id);
    } catch (e) {
      console.error(e);
    }
    try {
      if (!record) {
        record = await receiptService.createReceiptRecord(payment.id, invoice.id, currentUser.id, "system");
      }
      setActiveReceiptData({ payment, invoice, record });
    } catch (error) {
      console.error("Failed to fetch receipt", error);
    } finally {
      setIsLoadingReceipt(null);
    }
  };

  if (!mounted || !currentUser || !isInitialized) return null;

  let currentBalance = 0;
  let percentPaid = 100;
  let isCurrentFuture = false;

  if (currentInvoice) {
    const daysUntilDue = (new Date(currentInvoice.dueDate).getTime() - Date.now()) / (1000 * 3600 * 24);
    if (currentInvoice.status !== "paid" && daysUntilDue <= 7) {
      currentBalance = currentInvoice.totalAmount - currentInvoice.amountPaid;
      percentPaid = Math.min(100, Math.max(0, Math.round((currentInvoice.amountPaid / currentInvoice.totalAmount) * 100)));
    } else if (currentInvoice.status !== "paid" && daysUntilDue > 7) {
      // Future invoice, > 7 days away. Show as 0 balance.
      currentBalance = 0;
      percentPaid = 100;
      isCurrentFuture = true;
    } else {
      // Paid
      currentBalance = 0;
      percentPaid = 100;
    }
  }

  const isOverdue = currentInvoice?.status === "overdue";
  // It's considered "paid" for UI purposes if it's actually paid, OR if it's a future invoice > 7 days away
  const isPaid = currentInvoice?.status === "paid" || isCurrentFuture;
  const pendingPayment = currentInvoice ? payments.find(p => p.invoiceId === currentInvoice.id && p.status === "pending_verification") : null;
  
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentPaid / 100) * circumference;

  const handleFeesPaid = (invoiceId: string, balance: number) => {
    setIsSubmitting(true);
    setTimeout(() => {
      submitPayment(invoiceId, balance, "UPI", `TXN${Math.random().toString().slice(2, 10)}`);
      setIsSubmitting(false);
      
      // Pop up message
      window.alert("Your request for the verification of payment is sent");
      
      // Show notification to student
      useNotificationStore.getState().addNotification({
        recipientId: currentUser.id,
        title: "Receipt Requested",
        message: "Your request for the receipt has been sent to the teacher.",
        link: "/dashboard/student/fees"
      });
    }, 1000);
  };

  const getMappedReceiptData = (): FeeReceiptData | null => {
    if (!activeReceiptData || !currentUser || currentUser.role !== "student") return null;
    const { invoice, payment, record } = activeReceiptData;
    const student = currentUser as Student;

      const verifierName = payment.verifierName || "Admin";

      return {
        receiptNumber: record.id,
        receiptDate: new Date(record.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
        student: {
          name: student.name,
          fatherName: student.fatherName || "Not Provided",
          classBatch: student.grade || "Regular Batch",
          studentId: student.id,
          phone: student.parentPhone || "Not Provided",
          photoUrl: student.avatar
        },
        payment: {
          feeType: "Monthly Tuition Fee",
          month: new Date(invoice.month).toLocaleString(undefined, { month: 'long', year: 'numeric' }),
          dueDate: new Date(invoice.dueDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
          mode: payment.mode,
          transactionId: payment.referenceNumber || payment.id,
          paymentDateTime: new Date(payment.paymentDate).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })
        },
        breakdown: {
          monthlyFee: invoice.baseAmount,
          discount: invoice.discountAmount,
          lateFee: invoice.lateFeeAmount,
          previousBalance: invoice.previousBalance,
          totalPaid: invoice.amountPaid
        },
        verification: {
          verifierName: verifierName,
          verifiedDateTime: new Date(payment.paymentDate).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }),
          isSystemVerified: true
        }
      };
  };

  return (
    <DashboardLayout role="student">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-6">
          
          <motion.div variants={itemVariants} className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-[#5B5CFF]" />
              Fee Management
            </h1>
            <p className="text-sm text-[#7B8798]">View and manage your fee payments</p>
          </motion.div>

          {feeProfile && (
            <motion.div variants={itemVariants}>
              <GlassCard className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-[#5B5CFF]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5B5CFF]/20 flex items-center justify-center shrink-0">
                    <IndianRupee className="w-5 h-5 text-[#5B5CFF]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#B6C2D9]">Assigned Monthly Fee</h3>
                    <p className="text-xl font-bold text-white">₹{feeProfile.monthlyFee.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="text-sm text-[#7B8798]">
                  <p>Billing Cycle: <span className="text-white capitalize">{feeProfile.paymentFrequency}</span></p>
                  <p>Due Date: <span className="text-white">Day {feeProfile.preferredDueDate} of month</span></p>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {currentInvoice && (
            <motion.div variants={itemVariants}>
              <GlassCard className="relative overflow-hidden p-6 lg:p-8">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5B5CFF] to-[#8B5CF6]" />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-sm font-semibold text-[#B6C2D9]">Current Month Dues</h2>
                      {isPaid ? (
                        <StatusBadge variant="success">Paid</StatusBadge>
                      ) : isOverdue ? (
                        <StatusBadge variant="error">Overdue</StatusBadge>
                      ) : pendingPayment ? (
                        <StatusBadge variant="warning">Receipt Requested</StatusBadge>
                      ) : (
                        <StatusBadge variant="info">Pending</StatusBadge>
                      )}
                    </div>
                    
                    <div className="flex items-center text-4xl font-bold text-white mb-4">
                      <IndianRupee className="w-7 h-7 mr-1 text-[#7B8798]" />
                      {currentBalance.toLocaleString('en-IN')}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-[#7B8798]">
                      <Calendar className="w-4 h-4" />
                      Due by: {new Date(currentInvoice.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto border-t md:border-t-0 md:border-l border-white/[0.08] pt-6 md:pt-0 md:pl-6">
                    <div className="relative flex items-center justify-center">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle 
                          className="text-white/[0.08]" 
                          strokeWidth="6" 
                          stroke="currentColor" 
                          fill="transparent" 
                          r="36" 
                          cx="48" 
                          cy="48" 
                        />
                        <circle 
                          className={cn(
                            "transition-all duration-1000 ease-in-out", 
                            isPaid ? "text-[#22C55E]" : isOverdue ? "text-[#EF4444]" : "text-[#5B5CFF]"
                          )}
                          strokeWidth="6" 
                          strokeDasharray={circumference} 
                          strokeDashoffset={strokeDashoffset} 
                          strokeLinecap="round" 
                          stroke="currentColor" 
                          fill="transparent" 
                          r="36" 
                          cx="48" 
                          cy="48" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-white">{percentPaid}%</span>
                        <span className="text-[10px] text-[#7B8798] uppercase tracking-wider">Paid</span>
                      </div>
                    </div>
                    
                  </div>

                </div>
              </GlassCard>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Invoice Breakdown */}
            {currentInvoice && (
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <GlassCard className="p-6 h-full flex flex-col">
                  <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#7B8798]" />
                    Bill Breakdown
                  </h3>
                  <div className="space-y-4 text-sm flex-1">
                    {currentInvoice.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[#B6C2D9]">
                        <span>{item.description}</span>
                        <span className="flex items-center text-white">
                          <IndianRupee className="w-3 h-3 text-[#7B8798] mr-0.5" />
                          {item.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                    
                    {currentInvoice.discountAmount > 0 && (
                      <div className="flex justify-between items-center text-[#22C55E]">
                        <span>Discount</span>
                        <span className="flex items-center">
                          -<IndianRupee className="w-3 h-3 mr-0.5" />
                          {currentInvoice.discountAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}

                    {currentInvoice.lateFeeAmount > 0 && (
                      <div className="flex justify-between items-center text-[#EF4444]">
                        <span>Late Fee</span>
                        <span className="flex items-center">
                          +<IndianRupee className="w-3 h-3 mr-0.5" />
                          {currentInvoice.lateFeeAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-white/[0.08] flex justify-between items-center font-bold text-white">
                    <span>Total Billed</span>
                    <span className="flex items-center text-lg">
                      <IndianRupee className="w-4 h-4 text-[#7B8798] mr-0.5" />
                      {currentInvoice.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Payment History */}
            <motion.div variants={itemVariants} className={currentInvoice ? "lg:col-span-2" : "lg:col-span-3"}>
              <GlassCard className="p-6 h-full">
                <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#7B8798]" />
                  Monthly Fees
                </h3>
                
                {invoices.length === 0 ? (
                  <EmptyState 
                    icon={<Receipt className="w-12 h-12 text-[#7B8798]" />} 
                    title="No Invoices" 
                    description="No invoices generated yet." 
                  />
                ) : (
                  <div className="space-y-4">
                    {invoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()).map(invoice => {
                      const monthText = new Date(invoice.month).toLocaleString(undefined, { month: 'long', year: 'numeric' });
                      const invoicePayment = payments.find(p => p.invoiceId === invoice.id);
                      
                      const isPaid = invoice.status === "paid";
                      const isPendingVerification = invoicePayment?.status === "pending_verification" || invoicePayment?.status === "student_paid";
                      const isRejected = invoicePayment?.status === "rejected";
                      const isOverdueItem = invoice.status === "overdue";
                      const isPending = invoice.status === "pending";

                      return (
                        <div key={invoice.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border border-white/[0.04] p-4 rounded-[14px]">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <p className="font-semibold text-white text-base">{monthText} Fee</p>
                              {isPaid ? (
                                <StatusBadge variant="success">Verified</StatusBadge>
                              ) : isPendingVerification ? (
                                <StatusBadge variant="warning">Receipt Requested</StatusBadge>
                              ) : isRejected ? (
                                <StatusBadge variant="error">Rejected</StatusBadge>
                              ) : isOverdueItem ? (
                                <StatusBadge variant="error">Overdue</StatusBadge>
                              ) : (
                                <StatusBadge variant="info">Pending</StatusBadge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap text-[13px] text-[#7B8798]">
                              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due: {new Date(invoice.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              {invoicePayment?.remark && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#EF4444]">
                                    {isRejected ? "Your request for the receipt is rejected, kindly contact the teacher. " : "Note: "}
                                    {invoicePayment.remark}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2 w-full sm:w-auto border-t sm:border-t-0 border-white/[0.08] pt-3 sm:pt-0">
                            <p className="font-semibold text-white flex items-center text-lg">
                              <IndianRupee className="w-4 h-4 text-[#7B8798] mr-0.5" />
                              {invoice.totalAmount.toLocaleString('en-IN')}
                            </p>
                            
                            <div className="flex gap-2 w-full sm:w-auto">
                              {!isPaid && !isPendingVerification && (
                                <GradientButton 
                                  onClick={() => handleFeesPaid(invoice.id, invoice.totalAmount - invoice.amountPaid)}
                                  loading={isSubmitting}
                                  className="w-full sm:w-auto py-2 px-4 text-xs"
                                >
                                  I have paid the fees, request receipt
                                </GradientButton>
                              )}
                              
                              {!isPaid && isPendingVerification && (
                                <button disabled className="px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] text-[#7B8798] text-xs font-medium w-full sm:w-auto cursor-not-allowed">
                                  Receipt Requested
                                </button>
                              )}

                              {isPaid && invoicePayment && (
                                <button 
                                  onClick={() => handleDownloadClick(invoicePayment, invoice)}
                                  disabled={isLoadingReceipt === invoicePayment.id}
                                  className={cn(
                                    "px-4 py-2 rounded-xl transition-all flex items-center justify-center shrink-0 text-xs font-medium text-white shadow-lg",
                                    isLoadingReceipt === invoicePayment.id
                                      ? 'bg-transparent border border-transparent text-[#7B8798] opacity-50 cursor-not-allowed shadow-none' 
                                      : 'bg-gradient-to-r from-[#2DD4BF] to-[#3B82F6] hover:opacity-90 shadow-blue-500/25 border border-white/10'
                                  )} 
                                >
                                  <Download className={cn("w-3.5 h-3.5 mr-1.5", isLoadingReceipt === invoicePayment.id && "animate-pulse")} />
                                  Download Receipt
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {activeReceiptData && currentUser && currentUser.role === "student" && (
        <FeeReceiptModal
          isOpen={true}
          onClose={() => setActiveReceiptData(null)}
          data={getMappedReceiptData()}
        />
      )}
    </DashboardLayout>
  );
}
