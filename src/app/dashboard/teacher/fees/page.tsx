"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { 
  Receipt, Wallet, AlertTriangle, TrendingUp, 
  Search, CheckCircle2, IndianRupee, Download, 
  Settings, Save, X, BellRing, RotateCcw
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { useFeeStore, Invoice, PaymentMode, FeeProfile, Payment } from "@/store/feeStore";
import { receiptService, ReceiptRecord } from "@/lib/firebase/receiptService";
import type { Student } from "@/types";
import { FeeReceiptModal } from "@/components/receipts/FeeReceiptModal";
import { FeeReceiptData } from "@/components/receipts/FeeReceiptTemplate";

import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import GradientButton from "@/components/ui/GradientButton";
import GlassButton from "@/components/ui/GlassButton";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function TeacherFeesPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated, getAllUsers } = useAuthStore();
  const { 
    isInitialized, initializeMockData, runDailyFeeEngine, 
    getTeacherDashboardStats, invoices, payments, recordPayment, undoPayment,
    verifyPayment, rejectPayment, feeProfiles, updateFeeProfile, remindStudent
  } = useFeeStore();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingProfileStudent, setEditingProfileStudent] = useState<Student | null>(null);
  
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("UPI");

  const [editMonthlyFee, setEditMonthlyFee] = useState("");
  const [editLateFeeType, setEditLateFeeType] = useState<FeeProfile["lateFeeRule"]["type"]>("per_day");
  const [editLateFeeAmount, setEditLateFeeAmount] = useState("");

  const [verifyingPayment, setVerifyingPayment] = useState<Payment | null>(null);
  const [verifyMode, setVerifyMode] = useState<PaymentMode>("UPI");
  const [verifyDate, setVerifyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [verifyRemark, setVerifyRemark] = useState("");
  const [verifyAmount, setVerifyAmount] = useState("");

  useEffect(() => {
    if (verifyingPayment) {
      setVerifyAmount(verifyingPayment.amount.toString());
    }
  }, [verifyingPayment]);

  const [activeReceiptData, setActiveReceiptData] = useState<{payment: Payment, invoice: Invoice, record: ReceiptRecord, student: Student} | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState<string | null>(null);

  const currentDate = new Date();
  const defaultMonthStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonthStr);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      // router.replace("/auth/login"); /* Handled by DashboardLayout */
      return;
    }
    initializeMockData();
    runDailyFeeEngine();
    setMounted(true);
  }, [isAuthenticated, currentUser, router, initializeMockData, runDailyFeeEngine, _hasHydrated]);

  const { students, stats, currentInvoices } = useMemo(() => {
    if (!isInitialized) return { students: [], stats: null, currentInvoices: [] };
    
    const allUsers = getAllUsers();
    const studentsList = allUsers.filter((u): u is Student => u.role === "student");
    const dashStats = getTeacherDashboardStats(selectedMonth);
    
    const currInvoices = invoices.filter(i => i.month === selectedMonth);

    return {
      students: studentsList,
      stats: dashStats,
      currentInvoices: currInvoices
    };
  }, [isInitialized, getAllUsers, getTeacherDashboardStats, invoices, selectedMonth]);

  if (!mounted || !currentUser || !isInitialized) return null;

  const availableMonths = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    return { value: val, label };
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount) return;
    
    const amountNum = parseFloat(paymentAmount);
    if (amountNum <= 0 || amountNum > (selectedInvoice.totalAmount - selectedInvoice.amountPaid)) return;

    recordPayment(selectedInvoice.id, amountNum, paymentMode, currentUser.id);
    
    // Receipt generation logic has been moved to on-demand via the modal
    setSelectedInvoice(null);
    setPaymentAmount("");
  };

  const openProfileEdit = (student: Student) => {
    const profile = feeProfiles.find(p => p.studentId === student.id);
    if (profile) {
      setEditingProfileStudent(student);
      setEditMonthlyFee(profile.monthlyFee.toString());
      setEditLateFeeType(profile.lateFeeRule.type);
      setEditLateFeeAmount(profile.lateFeeRule.amount.toString());
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfileStudent) return;
    
    const existingProfile = feeProfiles.find(p => p.studentId === editingProfileStudent.id);
    if (existingProfile) {
      const updatedProfile: FeeProfile = {
        ...existingProfile,
        monthlyFee: parseFloat(editMonthlyFee) || existingProfile.monthlyFee,
        lateFeeRule: {
          ...existingProfile.lateFeeRule,
          type: editLateFeeType,
          amount: parseFloat(editLateFeeAmount) || 0
        }
      };
      updateFeeProfile(updatedProfile);
    }
    setEditingProfileStudent(null);
  };

  const handleSendReminder = (studentId: string, studentName: string, amount: number, dueDate: string) => {
    remindStudent(studentId, amount, dueDate);
    alert(`Push notification sent to ${studentName}!`);
  };

  const handleDownloadReceiptClick = async (invoice: Invoice, student: Student) => {
    const payment = payments.find(p => p.invoiceId === invoice.id && p.status === "verified");
    if (!payment) return;
    setIsLoadingReceipt(payment.id);
    try {
      let record = await receiptService.getReceiptByPaymentId(payment.id);
      if (!record) {
        record = await receiptService.createReceiptRecord(payment.id, invoice.id, currentUser!.id, currentUser!.name);
      }
      setActiveReceiptData({ payment, invoice, record, student });
    } catch (error) {
      console.error("Failed to fetch receipt", error);
    } finally {
      setIsLoadingReceipt(null);
    }
  };

  const getMappedReceiptData = (): FeeReceiptData | null => {
    if (!activeReceiptData) return null;
    const { invoice, payment, record, student } = activeReceiptData;
  
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
        verifierName: payment.verifierName || currentUser?.name || "Admin",
        verifiedDateTime: new Date(record.createdAt).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }),
        isSystemVerified: true
      }
    };
  };

  const downloadPDFReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(91, 92, 255); 
    doc.text("Rudra Academy", 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    const monthLabel = availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth;
    doc.text(`Fee Collection Report - ${monthLabel}`, 14, 30);
    
    if (stats) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Expected Revenue: Rs. ${stats.expectedRevenue.toLocaleString('en-IN')}`, 14, 45);
      doc.text(`Collected Revenue: Rs. ${stats.collectedRevenue.toLocaleString('en-IN')}`, 14, 52);
      doc.text(`Pending Amount: Rs. ${stats.pendingRevenue.toLocaleString('en-IN')}`, 100, 45);
      doc.text(`Overdue Students: ${stats.overdueStudentsCount}`, 100, 52);
    }

    const tableBody = students.map(student => {
      const inv = currentInvoices.find(i => i.studentId === student.id);
      if (!inv) return [student.name, student.grade, "-", "-", "-", "-", "No Invoice"];
      
      const balance = inv.totalAmount - inv.amountPaid;
      return [
        student.name,
        student.grade,
        `Rs. ${inv.baseAmount.toLocaleString('en-IN')}`,
        `Rs. ${inv.lateFeeAmount.toLocaleString('en-IN')}`,
        `Rs. ${inv.amountPaid.toLocaleString('en-IN')}`,
        `Rs. ${balance.toLocaleString('en-IN')}`,
        inv.status.toUpperCase().replace("_", " ")
      ];
    });

    autoTable(doc, {
      startY: 65,
      head: [['Student Name', 'Grade', 'Base Fee', 'Late Fee', 'Amount Paid', 'Balance Due', 'Status']],
      body: tableBody,
      headStyles: { fillColor: [91, 92, 255] },
      alternateRowStyles: { fillColor: [240, 244, 255] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save(`Fee_Report_${selectedMonth}.pdf`);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch(status) {
      case "paid": return <StatusBadge variant="success">Paid</StatusBadge>;
      case "partially_paid": return <StatusBadge variant="info">Partial</StatusBadge>;
      case "overdue": return <StatusBadge variant="error">Overdue</StatusBadge>;
      case "waived": return <StatusBadge variant="default">Waived</StatusBadge>;
      default: return <StatusBadge variant="warning">Pending</StatusBadge>;
    }
  };

  return (
    <DashboardLayout role="teacher">
      <motion.div 
        className="space-y-6 pb-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Fee Management</h1>
            <p className="text-sm text-[#B6C2D9]">Automated tuition billing and collection engine.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#5B5CFF]/50 transition-colors appearance-none flex-1 md:flex-none cursor-pointer"
            >
              {availableMonths.map(m => (
                <option key={m.value} value={m.value} className="bg-[#0F172A]">{m.label}</option>
              ))}
            </select>
            
            <GradientButton onClick={downloadPDFReport} className="flex items-center shrink-0">
              <Download className="w-4 h-4 mr-2" /> Report PDF
            </GradientButton>
          </div>
        </motion.div>

        {/* Overview KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#5B5CFF]/20 rounded-[14px]">
                <TrendingUp className="w-5 h-5 text-[#5B5CFF]" />
              </div>
              <div>
                <p className="text-[13px] text-[#7B8798]">Expected Revenue</p>
                <p className="text-xl font-bold text-white flex items-center mt-1">
                  <IndianRupee className="w-4 h-4 mr-0.5 text-[#7B8798]" />
                  {stats?.expectedRevenue.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#22C55E]/20 rounded-[14px]">
                <Wallet className="w-5 h-5 text-[#22C55E]" />
              </div>
              <div>
                <p className="text-[13px] text-[#7B8798]">Collected</p>
                <p className="text-xl font-bold text-white flex items-center mt-1">
                  <IndianRupee className="w-4 h-4 mr-0.5 text-[#7B8798]" />
                  {stats?.collectedRevenue.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#FB923C]/20 rounded-[14px]">
                <Receipt className="w-5 h-5 text-[#FB923C]" />
              </div>
              <div>
                <p className="text-[13px] text-[#7B8798]">Pending Dues</p>
                <p className="text-xl font-bold text-white flex items-center mt-1">
                  <IndianRupee className="w-4 h-4 mr-0.5 text-[#7B8798]" />
                  {stats?.pendingRevenue.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#EF4444]/20 rounded-[14px]">
                <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div>
                <p className="text-[13px] text-[#7B8798]">Overdue Students</p>
                <p className="text-xl font-bold text-white mt-1">
                  {stats?.overdueStudentsCount}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Student Ledger */}
        <motion.div variants={itemVariants} className="pt-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-white">Ledger: {availableMonths.find(m => m.value === selectedMonth)?.label}</h2>
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/[0.03] border border-white/[0.08] rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-[#7B8798] focus:outline-none focus:border-[#5B5CFF]/50 transition-colors w-full sm:w-64"
              />
            </div>
          </div>

          <GlassCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse hidden lg:table">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                    <th className="px-6 py-4 text-[11px] font-medium text-[#7B8798] uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-[11px] font-medium text-[#7B8798] uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-[11px] font-medium text-[#7B8798] uppercase tracking-wider">Base Fee</th>
                    <th className="px-6 py-4 text-[11px] font-medium text-[#7B8798] uppercase tracking-wider">Late/Discount</th>
                    <th className="px-6 py-4 text-[11px] font-medium text-[#7B8798] uppercase tracking-wider">Net Due</th>
                    <th className="px-6 py-4 text-[11px] font-medium text-[#7B8798] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[11px] font-medium text-[#7B8798] uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.08]">
                  {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((student) => {
                    const invoice = currentInvoices.find(i => i.studentId === student.id);
                    if (!invoice) return (
                      <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/5">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{student.name}</p>
                              <p className="text-[13px] text-[#7B8798]">Grade {student.grade}</p>
                            </div>
                          </div>
                        </td>
                        <td colSpan={5} className="px-6 py-4 text-[13px] text-[#7B8798] italic">No invoice generated for this month.</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => openProfileEdit(student)} className="p-2 bg-white/5 hover:bg-white/10 text-[#7B8798] hover:text-white rounded-[10px] transition-colors inline-flex">
                            <Settings className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );

                    const balance = invoice.totalAmount - invoice.amountPaid;
                    const pendingPayment = payments.find(p => p.invoiceId === invoice.id && p.status === "pending_verification");

                    return (
                      <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5B5CFF] to-[#8B5CF6] flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/10">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{student.name}</p>
                              <p className="text-[13px] text-[#7B8798]">Grade {student.grade}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[13px] text-[#B6C2D9]">
                          {new Date(invoice.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[13px] text-[#B6C2D9]">
                          ₹{invoice.baseAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[13px]">
                          {invoice.lateFeeAmount > 0 && <span className="text-[#EF4444]">+₹{invoice.lateFeeAmount}</span>}
                          {invoice.discountAmount > 0 && <span className="text-[#22C55E] ml-2">-₹{invoice.discountAmount}</span>}
                          {invoice.lateFeeAmount === 0 && invoice.discountAmount === 0 && <span className="text-[#7B8798]">-</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                          ₹{balance.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {pendingPayment ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FB923C]/10 text-[#FB923C] border border-[#FB923C]/20 flex items-center inline-flex gap-1">
                              <CheckCircle2 className="w-3 h-3" /> VERIFY
                            </span>
                          ) : getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {balance > 0 ? (
                              <>
                                <button
                                  onClick={() => handleSendReminder(student.id, student.name, balance, new Date(invoice.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }))}
                                  className="px-2.5 py-1.5 rounded-[10px] bg-[#FB923C]/10 hover:bg-[#FB923C]/20 text-[#FB923C] text-[13px] font-medium border border-transparent hover:border-[#FB923C]/30 transition-all flex items-center gap-1.5"
                                  title="Send Push Reminder"
                                >
                                  <BellRing className="w-3.5 h-3.5" /> Remind
                                </button>
                                {pendingPayment ? (
                                  <button
                                    onClick={() => setVerifyingPayment(pendingPayment)}
                                    className="px-3 py-1.5 rounded-[10px] bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] text-[13px] font-medium border border-[#22C55E]/30 transition-all opacity-100 flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedInvoice(invoice);
                                      setPaymentAmount(balance.toString());
                                    }}
                                    className="px-3 py-1.5 rounded-[10px] bg-[#5B5CFF]/10 hover:bg-[#5B5CFF]/20 text-[#4F9DFF] text-[13px] font-medium border border-transparent hover:border-[#5B5CFF]/30 transition-all"
                                  >
                                    Record
                                  </button>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span title="Paid"><CheckCircle2 className="w-5 h-5 text-[#22C55E] mr-1" /></span>
                                <button 
                                  onClick={() => handleDownloadReceiptClick(invoice, student)} 
                                  disabled={isLoadingReceipt !== null}
                                  className="p-1.5 bg-[#4F9DFF]/10 hover:bg-[#4F9DFF]/20 text-[#4F9DFF] rounded-[10px] transition-colors border border-transparent hover:border-[#4F9DFF]/30 disabled:opacity-50" 
                                  title="View Receipt"
                                >
                                  <Receipt className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => undoPayment(invoice.id)} 
                                  className="p-1.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] rounded-[10px] transition-colors border border-transparent hover:border-[#EF4444]/30" 
                                  title="Mark as Unpaid"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            <button onClick={() => openProfileEdit(student)} className="p-2 bg-white/5 hover:bg-white/10 text-[#7B8798] hover:text-white rounded-[10px] transition-colors border border-transparent hover:border-white/10" title="Edit Fee Profile">
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile Cards View */}
              <div className="lg:hidden divide-y divide-white/[0.08]">
                {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((student) => {
                  const invoice = currentInvoices.find(i => i.studentId === student.id);
                  if (!invoice) return (
                    <div key={student.id} className="p-4 hover:bg-white/[0.02] transition-colors group relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0 border border-white/5">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{student.name}</p>
                            <p className="text-[13px] text-[#7B8798]">Grade {student.grade}</p>
                          </div>
                        </div>
                        <button onClick={() => openProfileEdit(student)} className="p-2 bg-white/5 hover:bg-white/10 text-[#7B8798] hover:text-white rounded-[10px] transition-colors border border-transparent hover:border-white/10" title="Edit Fee Profile">
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[13px] text-[#7B8798] italic">No invoice generated for this month.</p>
                    </div>
                  );

                  const balance = invoice.totalAmount - invoice.amountPaid;
                  const pendingPayment = payments.find(p => p.invoiceId === invoice.id && p.status === "pending_verification");

                  return (
                    <div key={student.id} className="p-4 hover:bg-white/[0.02] transition-colors group relative space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5B5CFF] to-[#8B5CF6] flex items-center justify-center text-sm font-bold text-white shrink-0 border border-white/10">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white flex items-center gap-2">
                              {student.name}
                              {pendingPayment ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#FB923C]/10 text-[#FB923C] border border-[#FB923C]/20 flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> VERIFY
                                </span>
                              ) : getStatusBadge(invoice.status)}
                            </p>
                            <p className="text-[13px] text-[#7B8798]">Due: {new Date(invoice.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-base font-bold text-white">₹{balance.toLocaleString('en-IN')}</p>
                           <p className="text-[11px] text-[#7B8798]">Net Due</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 pt-3 border-t border-white/[0.04]">
                        <div className="text-[12px] text-[#B6C2D9] flex flex-wrap items-center gap-2">
                           <span>Base: ₹{invoice.baseAmount.toLocaleString('en-IN')}</span>
                           {invoice.lateFeeAmount > 0 && <span className="text-[#EF4444]">+₹{invoice.lateFeeAmount}</span>}
                           {invoice.discountAmount > 0 && <span className="text-[#22C55E]">-₹{invoice.discountAmount}</span>}
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {balance > 0 ? (
                            <>
                              <button
                                onClick={() => handleSendReminder(student.id, student.name, balance, invoice.dueDate)}
                                className="p-1.5 rounded-[8px] bg-[#FB923C]/10 hover:bg-[#FB923C]/20 text-[#FB923C] border border-transparent hover:border-[#FB923C]/30 transition-all"
                                title="Send Reminder"
                              >
                                <BellRing className="w-4 h-4" />
                              </button>
                              {pendingPayment ? (
                                <button
                                  onClick={() => setVerifyingPayment(pendingPayment)}
                                  className="px-3 py-1 rounded-[8px] bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] text-[12px] font-medium border border-[#22C55E]/30 transition-all flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setPaymentAmount(balance.toString());
                                  }}
                                  className="px-3 py-1 rounded-[8px] bg-[#5B5CFF]/10 hover:bg-[#5B5CFF]/20 text-[#4F9DFF] text-[12px] font-medium border border-transparent hover:border-[#5B5CFF]/30 transition-all"
                                >
                                  Record
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span title="Paid"><CheckCircle2 className="w-4 h-4 text-[#22C55E] mr-1" /></span>
                              <button 
                                onClick={() => handleDownloadReceiptClick(invoice, student)} 
                                disabled={isLoadingReceipt !== null}
                                className="p-1.5 bg-[#4F9DFF]/10 hover:bg-[#4F9DFF]/20 text-[#4F9DFF] rounded-[8px] transition-colors border border-transparent hover:border-[#4F9DFF]/30 disabled:opacity-50" 
                                title="View Receipt"
                              >
                                <Receipt className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => undoPayment(invoice.id)} 
                                className="p-1.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] rounded-[8px] transition-colors border border-transparent hover:border-[#EF4444]/30" 
                                title="Mark as Unpaid"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          <button onClick={() => openProfileEdit(student)} className="p-1.5 bg-white/5 hover:bg-white/10 text-[#7B8798] hover:text-white rounded-[8px] transition-colors border border-transparent hover:border-white/10" title="Edit Fee Profile">
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </GlassCard>
        </motion.div>

        {/* Record Payment Modal */}
        <AnimatePresence>
          {selectedInvoice && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedInvoice(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-[#131D2E] border border-white/[0.08] rounded-[20px] w-full max-w-md overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-white/[0.08] bg-white/[0.02]">
                  <h3 className="text-lg font-bold text-white">Record Payment</h3>
                  <p className="text-[13px] text-[#7B8798] mt-1">Invoice {selectedInvoice.id.slice(-6)}</p>
                </div>

                <form onSubmit={handleRecordPayment} className="p-6 space-y-5">
                  <div>
                    <label className="block text-[13px] text-[#B6C2D9] mb-2">Amount to Collect (₹)</label>
                    <div className="relative">
                      <IndianRupee className="w-5 h-5 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number" step="1" max={selectedInvoice.totalAmount - selectedInvoice.amountPaid} required
                        value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors text-lg font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] text-[#B6C2D9] mb-2">Payment Mode</label>
                    <select
                      value={paymentMode} onChange={e => setPaymentMode(e.target.value as PaymentMode)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors cursor-pointer"
                    >
                      <option value="UPI" className="bg-[#0F172A]">UPI</option>
                      <option value="Cash" className="bg-[#0F172A]">Cash</option>
                      <option value="Bank Transfer" className="bg-[#0F172A]">Bank Transfer</option>
                    </select>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <GlassButton type="button" onClick={() => setSelectedInvoice(null)} className="flex-1 py-2.5">Cancel</GlassButton>
                    <GradientButton type="submit" className="flex-1 py-2.5">Confirm Payment</GradientButton>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Fee Profile Modal */}
        <AnimatePresence>
          {editingProfileStudent && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setEditingProfileStudent(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-[#131D2E] border border-white/[0.08] rounded-[20px] w-full max-w-md overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-white/[0.08] bg-white/[0.02] flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">Edit Fee Profile</h3>
                    <p className="text-[13px] text-[#7B8798] mt-1">Configuring billing rules for {editingProfileStudent.name}</p>
                  </div>
                  <button onClick={() => setEditingProfileStudent(null)} className="text-[#7B8798] hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                </div>

                <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
                  <div>
                    <label className="block text-[13px] text-[#B6C2D9] mb-2">Monthly Base Fee (₹)</label>
                    <input
                      type="number" required
                      value={editMonthlyFee} onChange={e => setEditMonthlyFee(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] text-[#B6C2D9] mb-2">Late Fee Type</label>
                    <select
                      value={editLateFeeType} onChange={e => setEditLateFeeType(e.target.value as any)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="none" className="bg-[#0F172A]">No Late Fee</option>
                      <option value="flat" className="bg-[#0F172A]">Flat Amount</option>
                      <option value="per_day" className="bg-[#0F172A]">Per Day Charge</option>
                      <option value="percentage" className="bg-[#0F172A]">Percentage of Total</option>
                    </select>
                  </div>

                  {editLateFeeType !== "none" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                      <label className="block text-[13px] text-[#B6C2D9] mb-2 mt-4">Late Fee Amount</label>
                      <input
                        type="number" required
                        value={editLateFeeAmount} onChange={e => setEditLateFeeAmount(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors"
                      />
                    </motion.div>
                  )}

                  <div className="pt-2">
                    <p className="text-[11px] text-[#7B8798] mb-4">Note: Profile changes will apply to the NEXT generated invoice, not current or past ones.</p>
                    <GradientButton type="submit" className="w-full py-2.5 flex items-center justify-center gap-2">
                      <Save className="w-4 h-4"/> Save Profile
                    </GradientButton>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verify Payment Modal */}
        <AnimatePresence>
          {verifyingPayment && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setVerifyingPayment(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-[#131D2E] border border-white/[0.08] rounded-[20px] w-full max-w-md overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-white/[0.08] bg-white/[0.02]">
                  <h3 className="text-lg font-bold text-white">Verify Payment</h3>
                  <p className="text-[13px] text-[#7B8798] mt-1">Please confirm the details of the received payment.</p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const dtIso = new Date(verifyDate).toISOString();
                  verifyPayment(verifyingPayment.id, dtIso, currentUser.id, verifyMode, verifyRemark, parseFloat(verifyAmount), currentUser.name);
                  
                  const invoice = invoices.find(i => i.id === verifyingPayment.invoiceId);
                  const student = students.find(s => s.id === verifyingPayment.studentId);
                  // generateIndividualReceipt logic removed, handled on-demand via modal now

                  setVerifyingPayment(null);
                  setVerifyRemark("");
                  setVerifyAmount("");
                }} className="p-6 space-y-5">
                  <div>
                    <label className="block text-[13px] text-[#B6C2D9] mb-2">Amount Received (₹)</label>
                    <input
                      type="number" required
                      value={verifyAmount} onChange={e => setVerifyAmount(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#B6C2D9] mb-2">Payment Date</label>
                    <input
                      type="date" required
                      value={verifyDate} onChange={e => setVerifyDate(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#B6C2D9] mb-2">Payment Mode</label>
                    <select
                      value={verifyMode} onChange={e => setVerifyMode(e.target.value as PaymentMode)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors cursor-pointer"
                    >
                      <option value="UPI" className="bg-[#0F172A]">UPI</option>
                      <option value="Cash" className="bg-[#0F172A]">Cash</option>
                      <option value="Bank Transfer" className="bg-[#0F172A]">Bank Transfer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[13px] text-[#B6C2D9] mb-2">Remarks / Note (Optional)</label>
                    <textarea
                      value={verifyRemark} onChange={e => setVerifyRemark(e.target.value)}
                      placeholder="e.g. Paid in cash to accounts department"
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors resize-none h-24"
                    />
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row sm:justify-end gap-3 mt-2">
                    <GlassButton type="button" onClick={() => setVerifyingPayment(null)} className="w-full sm:w-auto px-6 py-3 order-3 sm:order-1 text-sm">Cancel</GlassButton>
                    <button 
                      type="button" 
                      onClick={() => {
                        rejectPayment(verifyingPayment.id, verifyRemark);
                        setVerifyingPayment(null);
                        setVerifyRemark("");
                        setVerifyAmount("");
                      }}
                      className="w-full sm:w-auto py-3 px-6 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-all text-sm font-semibold whitespace-nowrap order-2 sm:order-2"
                    >
                      Decline Claim
                    </button>
                    <GradientButton type="submit" className="w-full sm:w-auto py-3 px-8 whitespace-nowrap shadow-lg shadow-[#5B5CFF]/25 order-1 sm:order-3 text-sm">Approve Payment</GradientButton>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <FeeReceiptModal
          isOpen={activeReceiptData !== null}
          onClose={() => setActiveReceiptData(null)}
          data={getMappedReceiptData()}
        />

      </motion.div>
    </DashboardLayout>
  );
}
