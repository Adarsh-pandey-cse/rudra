"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Search, UserPlus, Users2, Eye, EyeOff, Edit, Trash2, AlertCircle, BellRing, CheckCircle2, TrendingUp, IndianRupee, X, Download } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useDataStore } from "@/store/dataStore";
import { useFeeStore } from "@/store/feeStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import GlassButton from "@/components/ui/GlassButton";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getMasteryColor, getMasteryLevel, Student } from "@/types";

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

export default function StudentListPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated, getStudentUsers, getArchivedStudents, deleteStudent, updateStudent, archiveStudent, restoreStudent, users } = useAuthStore();
  const { getAllStudentProgress } = useDataStore();
  const { invoices, isInitialized, initializeMockData } = useFeeStore();
  
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");
  
  const [showPasswordId, setShowPasswordId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [avatarToView, setAvatarToView] = useState<{id: string, url: string, name: string} | null>(null);
  
  // Edit form state
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editClassId, setEditClassId] = useState("");
  const [editFatherName, setEditFatherName] = useState("");
    const [editGender, setEditGender] = useState<"male" | "female" | "">("");
  const [editMonthlyFee, setEditMonthlyFee] = useState("");
  const [editError, setEditError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      router.push("/auth/login");
      return;
    }
    initializeMockData();
    setMounted(true);
  }, [isAuthenticated, currentUser, router, initializeMockData, _hasHydrated]);

  const students = useMemo(() => activeTab === "active" ? getStudentUsers() : getArchivedStudents(), [getStudentUsers, getArchivedStudents, editingStudentId, activeTab, users]);
  const allProgress = getAllStudentProgress();

  const filteredStudents = useMemo(() => {
    return students
      .filter((u): u is Student => u.role === "student")
      .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.username || "").toLowerCase().includes(searchQuery.toLowerCase()))
      .map(s => {
        const studentInvoices = invoices.filter(inv => inv.studentId === s.id);
        const totalPending = studentInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.amountPaid), 0);
        
        return {
          ...s,
          progress: allProgress[s.id],
          balance: totalPending
        };
      });
  }, [students, allProgress, searchQuery, invoices]);

  const groupedStudents = useMemo(() => {
    const groups: Record<string, typeof filteredStudents> = {};
    filteredStudents.forEach(s => {
      const cls = s.classId || (s as Student).grade || "Unassigned";
      if (!groups[cls]) groups[cls] = [];
      groups[cls].push(s);
    });
    // Sort keys alphabetically
    return Object.keys(groups).sort().reduce((obj, key) => {
      obj[key] = groups[key];
      return obj;
    }, {} as Record<string, typeof filteredStudents>);
  }, [filteredStudents]);

  // Derived stats
  const totalStudents = students.length;
  const avgMastery = filteredStudents.length 
    ? Math.round(filteredStudents.reduce((acc, s) => acc + (s.progress?.overallScore || 0), 0) / filteredStudents.length)
    : 0;
  const totalPendingDues = filteredStudents.reduce((acc, s) => acc + s.balance, 0);

  if (!mounted || !currentUser) return null;

  const startEditing = (student: typeof students[0]) => {
    const { feeProfiles } = useFeeStore.getState();
    const profile = feeProfiles.find(p => p.studentId === student.id);

    setEditingStudentId(student.id);
    setEditName(student.name);
    setEditUsername(student.username || "");
    setEditPassword("••••••••"); 
    setEditClassId((student as any).classId || (student as any).grade || "6th");
    setEditFatherName((student as any).fatherName || "");
      setEditGender((student as any).gender || "male");
    setEditMonthlyFee(profile?.monthlyFee?.toString() || "5000");
    setEditError("");
  };

    const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId) return;
    
    // First update the name and email
    const res = await updateStudent(editingStudentId, editName, editUsername);
    if (!res.success) {
      setEditError(res.error || "Failed to update profile");
      return;
    }

    // Update classId, grade, and fatherName
    const { updateStudentProfile } = useAuthStore.getState();
    await updateStudentProfile(editingStudentId, { 
      classId: editClassId, 
      grade: editClassId, 
      fatherName: editFatherName, gender: editGender
      } as any);

    // Update monthly fee
    if (editMonthlyFee) {
      const { feeProfiles, updateFeeProfile } = useFeeStore.getState();
      const existingProfile = feeProfiles.find(p => p.studentId === editingStudentId);
      if (existingProfile) {
        await updateFeeProfile({ ...existingProfile, monthlyFee: parseFloat(editMonthlyFee) });
      } else {
        await updateFeeProfile({
          studentId: editingStudentId,
          monthlyFee: parseFloat(editMonthlyFee),
          paymentFrequency: "monthly",
          feeStartDate: new Date().toISOString(),
          isActive: true,
          discounts: [],
          lateFeeRule: { type: "per_day", amount: 50, gracePeriodDays: 5 }
        } as any);
      }
    }

    // Then update the password if it was changed
    if (editPassword && !editPassword.includes("") && editPassword !== "????????") {
      const { updateStudentPassword } = useAuthStore.getState();
      const pwRes = await updateStudentPassword(editingStudentId, editPassword);
      if (!pwRes.success) {
        setEditError(pwRes.error || "Failed to update password");
        return;
      }
    }

    setEditingStudentId(null);
    setSuccessMessage(`${editName} details updated successfully!`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleDelete = async (id: string, isArchived: boolean) => {
    if (isArchived) {
      if (confirm("Are you sure you want to permanently delete this student? This action cannot be undone.")) {
        await deleteStudent(id);
      }
    } else {
      if (confirm("Are you sure you want to move this student to Past Students? Their data will be preserved.")) {
        await archiveStudent(id);
      }
    }
  };

  const handleRestore = async (id: string) => {
    if (confirm("Are you sure you want to restore this student to active status?")) {
      await restoreStudent(id);
    }
  };

  const togglePassword = (id: string) => {
    setShowPasswordId(prev => prev === id ? null : id);
  };

  const handleRemoveAvatar = async (studentId: string) => {
    if (confirm("Are you sure you want to remove this student's profile picture? This action cannot be undone and will remove the picture everywhere.")) {
      try {
        const { updateAvatar } = useAuthStore.getState();
        await updateAvatar(studentId, "");
        setAvatarToView(null);
      } catch (error) {
        console.error("Failed to remove avatar", error);
        alert("Failed to remove avatar. Please try again.");
      }
    }
  };

  const handleSendReminder = (studentId: string, studentName: string, amount: number) => {
    const reminder = {
      id: `rem_${Date.now()}`,
      title: "Fee Reminder",
      body: `${studentName}, your fee of ₹${amount.toLocaleString('en-IN')} is overdue. Please pay at the earliest.`,
      date: new Date().toISOString()
    };
    
    localStorage.setItem(`manual_fee_reminder_${studentId}`, JSON.stringify(reminder));
    alert(`Push notification sent to ${studentName}!`);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.setTextColor(91, 92, 255); // Custom blue color
      doc.text("Student Data Export", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableColumn = ["Class", "Name", "Father's Name", "User ID", "Password", "Phone No"];
      const tableRows: any[] = [];

      // Get all students regardless of active tab or search
      const allActiveStudents = getStudentUsers() as Student[];
      
      const exportGrouped: Record<string, Student[]> = {};
      allActiveStudents.forEach(s => {
        const cls = s.classId || s.grade || "Unassigned";
        if (!exportGrouped[cls]) exportGrouped[cls] = [];
        exportGrouped[cls].push(s);
      });

      Object.keys(exportGrouped).sort().forEach(className => {
        exportGrouped[className].forEach(student => {
          const studentData = [
            className,
            student.name || "-",
            student.parentName || student.fatherName || "-",
            student.username || "-",
            student.password || "-",
            student.parentPhone || "-"
          ];
          tableRows.push(studentData);
        });
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [91, 92, 255] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 40 },
          2: { cellWidth: 40 },
          3: { cellWidth: 45 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 },
        },
      });

      doc.save(`student_data_export_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("PDF Export Error: ", error);
      alert("Failed to export PDF. Please check the console for details.");
    }
  };

  const handleWipeStudents = async () => {
    if (confirm("Are you absolutely sure? This will wipe all students and student-related data. It will NOT touch notices, notifications, or settings.")) {
      try {
        alert("Wiping started. Please wait, do not close the window...");
        const res = await fetch('/api/clean-students');
        const data = await res.json();
        if (res.ok) {
          alert(`Success! ${data.message}\n` + (data.results?.join('\n') || ''));
          window.location.reload();
        } else {
          alert("Wipe failed: " + data.error);
        }
      } catch (e: any) {
        alert("Wipe failed: " + e.message);
      }
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
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">My Students</h1>
            <p className="text-sm text-[#B6C2D9]">Manage your classroom, track progress, and view balances.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
                onClick={handleWipeStudents}
                className="flex items-center gap-2 px-4 py-2 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 hover:text-[#EF4444] rounded-xl font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Wipe All Students</span>
              </button>
            <GlassButton onClick={handleExportPDF} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Data</span>
            </GlassButton>
            <Link href="/dashboard/teacher/students/add">
              <GradientButton className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <span>Add Student</span>
              </GradientButton>
            </Link>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#5B5CFF]/20 rounded-xl">
                <Users2 className="w-6 h-6 text-[#5B5CFF]" />
              </div>
              <div>
                <p className="text-sm text-[#7B8798]">Total Students</p>
                <p className="text-2xl font-bold text-white">{totalStudents}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#2DD4BF]/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-[#2DD4BF]" />
              </div>
              <div>
                <p className="text-sm text-[#7B8798]">Average Mastery</p>
                <p className="text-2xl font-bold text-white">{avgMastery}%</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#FB923C]/20 rounded-xl">
                <IndianRupee className="w-6 h-6 text-[#FB923C]" />
              </div>
              <div>
                <p className="text-sm text-[#7B8798]">Pending Dues</p>
                <p className="text-2xl font-bold text-white">₹{totalPendingDues.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Avatar View Modal via Portal */}
        {mounted && createPortal(
          <AnimatePresence>
            {avatarToView && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setAvatarToView(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center gap-6"
                >
                  <div className="flex justify-between w-full items-center">
                    <h3 className="text-lg font-bold text-white">{avatarToView.name}'s Profile Picture</h3>
                    <button onClick={() => setAvatarToView(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-white/10 shadow-[0_0_30px_rgba(91,92,255,0.3)]">
                    {avatarToView.url.length < 10 ? (
                      <div className="w-full h-full bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] text-white flex items-center justify-center text-6xl font-bold">
                        {avatarToView.url}
                      </div>
                    ) : (
                      <img src={avatarToView.url} alt="Profile" className="w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="w-full flex gap-3">
                    <button 
                      onClick={() => handleRemoveAvatar(avatarToView.id)}
                      className="flex-1 py-3 px-4 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-[#EF4444]/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Picture
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Edit Modal */}
        {mounted && typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
          {editingStudentId && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl relative"
              >
                <GlassCard className="p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Edit Student Details</h2>
                    <button onClick={() => setEditingStudentId(null)} className="text-[#7B8798] hover:text-white transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  {editError && (
                    <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl flex items-center gap-2 text-[#EF4444] text-sm">
                      <AlertCircle className="w-4 h-4" /> {editError}
                    </div>
                  )}
                  <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm text-[#B6C2D9] mb-1">Full Name</label>
                          <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" />
                        </div>
                        <div>
                          <label className="block text-sm text-[#B6C2D9] mb-1">Username (Email)</label>
                          <input type="text" readOnly value={editUsername} title="Username cannot be changed after creation" className="w-full bg-white/[0.01] border border-white/[0.04] rounded-xl px-4 py-2 text-[#7B8798] outline-none cursor-not-allowed" />
                        </div>
                        <div>
                          <label className="block text-sm text-[#B6C2D9] mb-1">Password</label>
                          <input type="text" value={editPassword} onChange={e => setEditPassword(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" placeholder="Leave unchanged or type new password" />
                        </div>
                        <div>
                          <label className="block text-sm text-[#B6C2D9] mb-1">Class / Grade</label>
                          <select value={editClassId.replace('class-', '')} onChange={e => setEditClassId(e.target.value)} className="w-full bg-[#131D2E] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors appearance-none">
                              {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"].map((g) => (
                                <option key={g} value={g}>Class {g}</option>
                              ))}
                            </select>
                        </div>
                        <div>
                          <label className="block text-sm text-[#B6C2D9] mb-1">Gender</label>
                          <select value={editGender} onChange={e => setEditGender(e.target.value as any)} className="w-full bg-[#131D2E] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors appearance-none">
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-[#B6C2D9] mb-1">Father's Name</label>
                          <input type="text" value={editFatherName} onChange={e => setEditFatherName(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" placeholder="e.g. Ramesh Kumar" />
                        </div>
                        <div>
                          <label className="block text-sm text-[#B6C2D9] mb-1">Monthly Fee (₹)</label>
                          <input type="number" required value={editMonthlyFee} onChange={e => setEditMonthlyFee(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
                      <GlassButton type="button" onClick={() => setEditingStudentId(null)}>Cancel</GlassButton>
                      <GradientButton type="submit">Save Changes</GradientButton>
                    </div>
                  </form>
                </GlassCard>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
        )}

        {/* Search and Tabs */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <GlassCard className="p-2 flex items-center gap-3 w-full sm:w-auto flex-1">
            <div className="pl-3">
              <Search className="text-[#7B8798] w-5 h-5" />
            </div>
            <input 
              type="text" 
              placeholder="Search students by name or username..." 
              className="bg-transparent border-none outline-none flex-1 py-2 text-white placeholder-[#7B8798]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </GlassCard>
          
          <div className="flex bg-white/[0.03] p-1 rounded-lg border border-white/[0.05] w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab("active")}
              className={`flex-1 sm:flex-none px-6 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "active" ? "bg-[#5B5CFF] text-white" : "text-[#7B8798] hover:text-white"}`}
            >
              Active
            </button>
            <button 
              onClick={() => setActiveTab("past")}
              className={`flex-1 sm:flex-none px-6 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "past" ? "bg-[#5B5CFF] text-white" : "text-[#7B8798] hover:text-white"}`}
            >
              Past Students
            </button>
          </div>
        </motion.div>

        {/* Students List */}
        <motion.div variants={itemVariants}>
          {students.length === 0 ? (
            <EmptyState 
              icon={<Users2 className="w-12 h-12 text-[#7B8798]" />}
              title="No students yet"
              description="You haven't added any students to your class. Add your first student to start tracking their progress."
              action={
                <Link href="/dashboard/teacher/students/add">
                  <GradientButton className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    <span>Add First Student</span>
                  </GradientButton>
                </Link>
              }
            />
          ) : (
            <GlassCard className="overflow-hidden p-0">
              {/* Desktop Table View */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                      <th className="px-6 py-4 text-[11px] font-medium text-[#7B8798] uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-[11px] font-medium text-[#7B8798] uppercase tracking-wider">Credentials</th>
                      <th className="px-6 py-4 text-[11px] font-medium text-[#7B8798] uppercase tracking-wider">Details & Fees</th>
                      {activeTab === "active" ? (
                        <th className="px-6 py-4 text-[11px] font-medium text-[#7B8798] uppercase tracking-wider">Mastery</th>
                      ) : (
                        <th className="px-6 py-4 text-[11px] font-medium text-[#7B8798] uppercase tracking-wider">Leave Date</th>
                      )}
                      <th className="px-6 py-4 text-[11px] font-medium text-[#7B8798] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.08]">
                    {Object.keys(groupedStudents).length > 0 ? (
                      Object.entries(groupedStudents).flatMap(([className, classStudents]) => [
                        <tr key={`group-${className}`} className="bg-[#07111F]/80 border-y border-white/[0.08]">
                          <td colSpan={5} className="px-6 py-3 text-xs font-bold text-[#4F9DFF] uppercase tracking-widest">
                            Class: {className} <span className="text-[#7B8798] ml-2">({classStudents.length} Students)</span>
                          </td>
                        </tr>,
                        ...classStudents.map((s) => {
                          const score = s.progress?.overallScore ?? 0;
                          const color = getMasteryColor(getMasteryLevel(score));
                          const isShowingPassword = showPasswordId === s.id;
                          
                          return (
                            <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-6 py-4 cursor-pointer" onClick={() => router.push("/dashboard/teacher/progress")}>
                                <div className="flex items-center gap-3">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (s.avatar) setAvatarToView({ id: s.id, url: s.avatar, name: s.name });
                                    }}
                                    className={`w-10 h-10 rounded-full bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-lg border border-white/10 ${s.avatar ? 'cursor-pointer hover:ring-2 hover:ring-[#5B5CFF] transition-all' : ''}`}
                                    title={s.avatar ? "View Profile Picture" : ""}
                                  >
                                    {s.avatar ? (
                                      s.avatar.length < 10 ? (
                                        <span className="text-xl">{s.avatar}</span>
                                      ) : (
                                        <img src={s.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                      )
                                    ) : (
                                      s.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                                    )}
                                  </button>
                                  <div>
                                    <div className="text-sm font-semibold text-white">{s.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[13px] text-[#B6C2D9] font-mono">@{s.username}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[13px] text-[#B6C2D9] font-mono bg-white/[0.06] px-2 py-0.5 rounded border border-white/[0.08]">
                                      {isShowingPassword ? (s.password || "No Password Set") : "••••••••"}
                                    </span>
                                    <button onClick={() => togglePassword(s.id)} className="text-[#7B8798] hover:text-white transition-colors" title="Toggle Password">
                                      {isShowingPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 text-[13px] text-[#B6C2D9]">
                                  <div>Grade: <span className="text-white">{(s as Student).grade || 'N/A'}</span></div>
                                  {(s as Student).parentName && (
                                    <div>Parent: <span className="text-white">{(s as Student).parentName}</span></div>
                                  )}
                                  {(s as Student).parentPhone && (
                                    <div>Phone: <span className="text-white">{(s as Student).parentPhone}</span></div>
                                  )}
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="text-[#7B8798]">Dues:</span>
                                    {s.balance > 0 ? (
                                      <span className="text-[#EF4444] font-medium">₹{s.balance.toLocaleString('en-IN')}</span>
                                    ) : (
                                      <span className="text-[#22C55E] font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Clear</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {activeTab === "active" ? (
                                  <div className="flex flex-col gap-2 cursor-pointer" onClick={() => router.push("/dashboard/teacher/progress")}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color, color: color }} />
                                      <span className="text-sm font-semibold text-white">{score}%</span>
                                    </div>
                                    <div className="w-24 bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                                      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: color }} />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[13px] text-white">
                                    {s.leaveDate ? new Date(s.leaveDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {activeTab === "active" ? (
                                    <>
                                      <button 
                                        onClick={() => handleSendReminder(s.id, s.name, s.balance)}
                                        className={`p-2 rounded-xl transition-colors ${s.balance > 0 ? 'text-[#FB923C] hover:bg-[#FB923C]/10' : 'text-[#7B8798] opacity-50 cursor-not-allowed'}`}
                                        disabled={s.balance <= 0}
                                        title={s.balance > 0 ? "Send Fee Reminder" : "No Pending Dues"}
                                      >
                                        <BellRing className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => startEditing(s)} className="p-2 text-[#7B8798] hover:text-[#2DD4BF] hover:bg-[#2DD4BF]/10 rounded-xl transition-colors" title="Edit Student">
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleDelete(s.id, false)} className="p-2 text-[#7B8798] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-xl transition-colors" title="Archive Student">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => handleRestore(s.id)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#2DD4BF] hover:bg-[#2DD4BF]/10 border border-[#2DD4BF]/20 rounded-lg transition-colors">
                                        <UserPlus className="w-3.5 h-3.5" />
                                        Restore to Class
                                      </button>
                                      <button onClick={() => handleDelete(s.id, true)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete Permanently
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ])
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-[#7B8798] text-sm">
                          No students match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden flex flex-col divide-y divide-white/[0.08]">
                {Object.keys(groupedStudents).length > 0 ? (
                  Object.entries(groupedStudents).map(([className, classStudents]) => (
                    <div key={`mobile-group-${className}`}>
                      <div className="bg-[#07111F]/80 border-y border-white/[0.08] px-4 py-2.5 text-xs font-bold text-[#4F9DFF] uppercase tracking-widest sticky top-0 z-10">
                        Class: {className} <span className="text-[#7B8798] ml-1">({classStudents.length})</span>
                      </div>
                      <div className="divide-y divide-white/[0.04]">
                        {classStudents.map((s) => {
                          const score = s.progress?.overallScore ?? 0;
                          const color = getMasteryColor(getMasteryLevel(score));
                          const isShowingPassword = showPasswordId === s.id;
                          
                          return (
                            <div key={`mobile-${s.id}`} className="p-4 flex flex-col gap-4 hover:bg-white/[0.02] transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (s.avatar) setAvatarToView({ id: s.id, url: s.avatar, name: s.name });
                                    }}
                                    className={`w-12 h-12 rounded-full bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] text-white flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden shadow-lg border border-white/10 ${s.avatar ? 'cursor-pointer hover:ring-2 hover:ring-[#5B5CFF] transition-all' : ''}`}
                                    title={s.avatar ? "View Profile Picture" : ""}
                                  >
                                    {s.avatar ? (
                                      s.avatar.length < 10 ? (
                                        <span className="text-2xl">{s.avatar}</span>
                                      ) : (
                                        <img src={s.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                      )
                                    ) : (
                                      s.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                                    )}
                                  </button>
                                  <div className="cursor-pointer" onClick={() => router.push("/dashboard/teacher/progress")}>
                                    <div className="text-sm font-bold text-white mb-0.5">{s.name}</div>
                                      {(s as any).fatherName && <div className="text-[11px] text-[#7B8798] mb-0.5">{(s as any).gender === "female" ? "D/O" : "S/O"} {((s as any).fatherName || "").trim().toLowerCase().startsWith("mr") ? (s as any).fatherName : `Mr. ${(s as any).fatherName}`}</div>}
                                    <span className="text-[12px] text-[#B6C2D9] font-mono">@{s.username}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {activeTab === "active" ? (
                                    <>
                                      <button onClick={() => startEditing(s)} className="p-2 bg-white/5 text-[#4F9DFF] rounded-[10px]">
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleDelete(s.id, false)} className="p-2 bg-white/5 text-[#EF4444] rounded-[10px]">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <button onClick={() => handleRestore(s.id)} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#2DD4BF] bg-white/5 hover:bg-[#2DD4BF]/10 rounded-xl transition-colors">
                                        <UserPlus className="w-4 h-4 shrink-0" />
                                        Restore
                                      </button>
                                      <button onClick={() => handleDelete(s.id, true)} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#EF4444] bg-white/5 hover:bg-[#EF4444]/10 rounded-xl transition-colors">
                                        <Trash2 className="w-4 h-4 shrink-0" />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 text-[13px] text-[#B6C2D9] bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[#7B8798] text-[10px] uppercase">Password</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono">{isShowingPassword ? (s.password || "None") : "••••••••"}</span>
                                    <button onClick={() => togglePassword(s.id)} className="text-[#7B8798] hover:text-white">
                                      {isShowingPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[#7B8798] text-[10px] uppercase">Dues</span>
                                  {s.balance > 0 ? (
                                    <span className="text-[#EF4444] font-semibold">₹{s.balance.toLocaleString('en-IN')}</span>
                                  ) : (
                                    <span className="text-[#22C55E] font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Clear</span>
                                  )}
                                </div>
                                {(s as Student).parentName && (
                                  <div className="flex flex-col gap-1 col-span-2">
                                    <span className="text-[#7B8798] text-[10px] uppercase">Parent Name</span>
                                    <span className="text-white">{(s as Student).parentName}</span>
                                  </div>
                                )}
                                {(s as Student).parentPhone && (
                                  <div className="flex flex-col gap-1 col-span-2">
                                    <span className="text-[#7B8798] text-[10px] uppercase">Parent Phone</span>
                                    <span className="text-white">{(s as Student).parentPhone}</span>
                                  </div>
                                )}
                              </div>
                              
                              {activeTab === "active" ? (
                                <div className="flex flex-col gap-1.5 cursor-pointer" onClick={() => router.push("/dashboard/teacher/progress")}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-[#7B8798] uppercase">Mastery</span>
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color, color: color }} />
                                      <span className="text-xs font-semibold text-white">{score}%</span>
                                    </div>
                                  </div>
                                  <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                                    <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: color }} />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
                                  <span className="text-[11px] text-[#7B8798] uppercase">Leave Date</span>
                                  <span className="text-sm font-semibold text-white">{s.leaveDate ? new Date(s.leaveDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-[#7B8798] text-sm">
                    No students match your search.
                  </div>
                )}
              </div>
            </GlassCard>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
