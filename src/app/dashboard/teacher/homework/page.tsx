"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, MoreVertical, BrainCircuit, Calendar, Users, ClipboardList, Clock, FileText, Trash2, Edit3, X } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import StatusBadge from "@/components/ui/StatusBadge";
import { SubjectIcon } from "@/components/ui/SubjectIcon";
import EmptyState from "@/components/ui/EmptyState";
import { useHomeworkStore } from "@/store/homeworkStore";
import { useAuthStore } from "@/store/authStore";
import { useDataStore } from "@/store/dataStore";
import { cn } from "@/lib/utils";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function HomeworkPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const { getTeacherAssignments, getAssignmentSubmissions, deleteAssignment, updateAssignment } = useHomeworkStore();
  const assignmentsList = useHomeworkStore(state => state.assignments);
  const submissionsList = useHomeworkStore(state => state.submissions);
  const { subjects } = useDataStore();
  
  const [mounted, setMounted] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<any>(null);
  
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extendDateTime, setExtendDateTime] = useState("");
  const [assignmentToExtend, setAssignmentToExtend] = useState<any>(null);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<any>(null);
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState<any>("published");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      // router.replace("/auth/login"); /* Handled by DashboardLayout */
      return;
    }
    setMounted(true);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  // Close menu on click outside
  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  if (!mounted || !currentUser) return null;

  const teacherAssignments = getTeacherAssignments(currentUser.id);
  
  const filteredAssignments = teacherAssignments.filter(assignment => {
    let matchesStatus = false;
    const isPastDue = new Date(assignment.dueDate) < new Date();
    if (statusFilter === "all") matchesStatus = true;
    else if (statusFilter === "active") matchesStatus = assignment.status === "published" && !isPastDue;
    else if (statusFilter === "closed") matchesStatus = assignment.status === "published" && isPastDue;
    else if (statusFilter === "draft") matchesStatus = assignment.status === "draft";
    else if (statusFilter === "scheduled") matchesStatus = assignment.status === "scheduled";
    const matchesClass = classFilter === "all" || assignment.classId === classFilter;
    return matchesStatus && matchesClass;
  }).sort((a, b) => {
    if (a.classId !== b.classId) return a.classId.localeCompare(b.classId);
    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
  });

  const getStatusVariant = (status: string): "success" | "info" | "warning" | "error" | "default" => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'default';
      case 'scheduled': return 'info';
      default: return 'default';
    }
  };

  const totalAssigned = teacherAssignments.length;
  const activeAssigned = teacherAssignments.filter(a => a.status === 'published').length;
  const draftAssigned = teacherAssignments.filter(a => a.status === 'draft').length;

  const handleDelete = () => {
    if (assignmentToDelete) {
      deleteAssignment(assignmentToDelete.id);
      setDeleteModalOpen(false);
      setAssignmentToDelete(null);
    }
  };

  const handleExtendSave = async () => {
    if (assignmentToExtend && extendDateTime) {
      try {
        const newDue = new Date(extendDateTime);
        const originalDue = assignmentToExtend.originalDueDate || assignmentToExtend.dueDate;
        
        await updateAssignment(assignmentToExtend.id, {
          dueDate: newDue.toISOString(),
          dueTime: `${newDue.getHours().toString().padStart(2, '0')}:${newDue.getMinutes().toString().padStart(2, '0')}`,
          isExtended: true,
          originalDueDate: originalDue
        });
        
        const { eventBus } = await import("@/lib/eventBus");
        
        const submissions = getAssignmentSubmissions(assignmentToExtend.id);
        const submittedStudentIds = submissions.map(s => s.studentId);
        const assignedStudentIds = assignmentToExtend.recipientStudentIds || assignmentToExtend.assignedTo || [];
        const unsubmittedStudentIds = assignedStudentIds.filter((id: string) => !submittedStudentIds.includes(id));
        
        if (unsubmittedStudentIds.length > 0) {
          eventBus.emit({
            type: 'HOMEWORK_DEADLINE_EXTENDED',
            payload: {
              assignmentId: assignmentToExtend.id,
              title: assignmentToExtend.title,
              studentIds: unsubmittedStudentIds,
              newDate: newDue.toISOString()
            }
          });
        }
        
        setExtendModalOpen(false);
        setAssignmentToExtend(null);
        setExtendDateTime("");
      } catch (err) {
        console.error("Error extending deadline:", err);
      }
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-8 pb-24">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#5B5CFF]/10 text-[#5B5CFF] border border-[#5B5CFF]/20 shadow-[0_0_15px_rgba(91,92,255,0.1)]">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[#B6C2D9]">
                Homework Management
              </h1>
              <p className="text-sm text-[#7B8798] mt-1">Create and manage assignments</p>
            </div>
          </motion.div>
          <motion.div variants={itemVariants}>
            <GradientButton onClick={() => router.push("/dashboard/teacher/homework/create")} className="flex items-center gap-2">
              <Plus className="w-5 h-5" /> Create Homework
            </GradientButton>
          </motion.div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div variants={itemVariants}>
            <GlassCard className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-[14px] bg-white/[0.06] text-white">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[13px] text-[#7B8798] uppercase tracking-wider font-medium">Total Assigned</p>
                <p className="text-2xl font-bold text-white mt-1">{totalAssigned}</p>
              </div>
            </GlassCard>
          </motion.div>
          <motion.div variants={itemVariants}>
            <GlassCard className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-[14px] bg-[#22C55E]/10 text-[#22C55E]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[13px] text-[#7B8798] uppercase tracking-wider font-medium">Active (Published)</p>
                <p className="text-2xl font-bold text-white mt-1">{activeAssigned}</p>
              </div>
            </GlassCard>
          </motion.div>
          <motion.div variants={itemVariants}>
            <GlassCard className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-[14px] bg-[#B6C2D9]/10 text-[#B6C2D9]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[13px] text-[#7B8798] uppercase tracking-wider font-medium">Drafts</p>
                <p className="text-2xl font-bold text-white mt-1">{draftAssigned}</p>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            {["all", "active", "closed", "draft", "scheduled"].map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={cn(
                  "px-4 py-2 rounded-[14px] text-sm font-medium transition-all capitalize",
                  statusFilter === tab
                    ? "bg-white/[0.1] text-white border border-white/[0.16] shadow-sm"
                    : "text-[#7B8798] hover:text-[#B6C2D9] hover:bg-white/[0.06] border border-transparent"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-[#7B8798]">Class Filter:</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-[#131D2E] text-white text-sm border border-white/[0.1] rounded-xl px-3 py-2 outline-none focus:border-[#5B5CFF] transition-colors"
            >
              <option value="all">All Classes</option>
              {Array.from(new Set(teacherAssignments.map(a => a.classId).filter(Boolean))).map(cId => (
                <option key={cId} value={cId}>{cId.replace("class-", "Class ")}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Assignments List */}
        {filteredAssignments.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredAssignments.map((assignment) => {
              const subject = subjects.find(s => s.id === assignment.subjectId);
              const isMenuOpen = openMenuId === assignment.id;
              
              return (
                <motion.div 
                  key={assignment.id} 
                  variants={itemVariants} 
                  layout 
                  onClick={() => router.push(`/dashboard/teacher/homework/analytics/${assignment.id}`)} 
                  className={`cursor-pointer group relative bg-[#0B1527] border border-white/[0.06] hover:border-[#5B5CFF]/40 rounded-2xl p-5 transition-all shadow-lg hover:shadow-xl flex flex-col h-full gap-4 ${isMenuOpen ? 'z-50' : 'z-10'}`}
                >
                  {/* Top Row: Icon, Title, Menu */}
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.05] flex items-center justify-center shrink-0">
                        <SubjectIcon iconName={subject?.icon || 'book'} className="w-5 h-5 text-[#B6C2D9]" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-base font-semibold text-white truncate group-hover:text-[#5B5CFF] transition-colors" title={assignment.title}>
                          {assignment.title}
                        </h3>
                        <p className="text-xs text-[#7B8798] truncate mt-0.5" title={assignment.topicTitle}>{assignment.topicTitle}</p>
                      </div>
                    </div>
                    
                    <div className="relative z-50 shrink-0">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenMenuId(isMenuOpen ? null : assignment.id);
                        }}
                        className="p-1.5 rounded-lg text-[#7B8798] hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      <AnimatePresence>
                        {isMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-1 w-36 bg-[#131D2E] border border-white/[0.08] rounded-xl shadow-2xl py-1 z-50 overflow-hidden"
                          >
                              <button 
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); router.push(`/dashboard/teacher/homework/edit/${assignment.id}`); }}
                                className="w-full text-left px-4 py-2 text-sm text-[#B6C2D9] hover:bg-white/[0.06] hover:text-white flex items-center gap-2"
                              >
                                <Edit3 className="w-4 h-4" /> Edit
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setAssignmentToExtend(assignment); setExtendDateTime(new Date(assignment.dueDate).toISOString().slice(0, 16)); setExtendModalOpen(true); }}
                                className="w-full text-left px-4 py-2 text-sm text-[#B6C2D9] hover:bg-[#5B5CFF]/10 hover:text-[#5B5CFF] flex items-center gap-2"
                              >
                                <Clock className="w-4 h-4" /> {new Date(assignment.dueDate) < new Date() ? 'Reopen' : 'Extend'}
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setAssignmentToDelete(assignment); setDeleteModalOpen(true); }}
                                className="w-full text-left px-4 py-2 text-sm text-[#EF4444] hover:bg-[#EF4444]/10 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Middle Row: Badges */}
                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    {(() => {
                       const assignedCount = ((assignment as any).assignedTo || (assignment as any).recipientStudentIds || []).length;
                       const subCount = getAssignmentSubmissions(assignment.id).length;
                       const isAllSubmitted = assignedCount > 0 && subCount === assignedCount;
                       return (
                         <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider", isAllSubmitted ? "bg-[#22C55E]/10 text-[#22C55E]" : getStatusVariant(assignment.status) === 'success' ? "bg-[#22C55E]/10 text-[#22C55E]" : getStatusVariant(assignment.status) === 'info' ? "bg-[#4F9DFF]/10 text-[#4F9DFF]" : "bg-white/[0.06] text-[#B6C2D9]")}>
                           {isAllSubmitted ? "Submitted by All" : assignment.status}
                         </span>
                       );
                    })()}
                    {assignment.classId && (
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-white/[0.04] text-[#7B8798] border border-white/[0.05]">
                        {assignment.classId.replace("class-", "Class ")}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#4F9DFF]/10 text-[#4F9DFF]">
                      {((assignment as any).maxGrade || (assignment as any).maxMarks || 0)} Marks
                    </span>
                    {assignment.evaluationMethod !== "Teacher Only" && (
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center gap-1">
                        <BrainCircuit className="w-3 h-3" /> AI
                      </span>
                    )}
                  </div>

                  {/* Bottom Row: Date and Submissions */}
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[#7B8798]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className={cn("font-medium", new Date(assignment.dueDate) < new Date() ? 'text-[#EF4444]' : '', (assignment as any).isExtended ? 'text-[#F59E0B]' : '')}>
                        {new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#7B8798]">
                      <Users className="w-3.5 h-3.5 text-[#B6C2D9]" />
                      <span className="font-bold text-[#B6C2D9]">{getAssignmentSubmissions(assignment.id).length}</span>
                      <span className="opacity-60">/ {((assignment as any).assignedTo || (assignment as any).recipientStudentIds || []).length}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <EmptyState
              icon={<BookOpen className="w-12 h-12 text-[#7B8798]" />}
              title="No assignments found"
              description="You haven't created any assignments in this category yet."
              action={
                <GradientButton onClick={() => router.push("/dashboard/teacher/homework/create")}>
                  Create Homework
                </GradientButton>
              }
            />
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#0B1527] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 relative"
            >
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="absolute top-4 right-4 text-[#7B8798] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-[#EF4444]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete Assignment?</h2>
              <p className="text-[#B6C2D9] text-sm mb-6">
                Are you sure you want to delete <span className="font-bold text-white">"{assignmentToDelete?.title}"</span>? This action cannot be undone and will delete all student submissions.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#EF4444] hover:bg-[#EF4444]/90 transition-colors shadow-lg shadow-[#EF4444]/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Extend Deadline Modal */}
      <AnimatePresence>
        {extendModalOpen && assignmentToExtend && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#0B1527] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 relative"
            >
              <button 
                onClick={() => setExtendModalOpen(false)}
                className="absolute top-4 right-4 text-[#7B8798] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#5B5CFF]" /> Extend Deadline
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#B6C2D9] mb-1.5">New Deadline</label>
                  <input
                    type="datetime-local"
                    value={extendDateTime}
                    onChange={(e) => setExtendDateTime(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0B1527] border border-white/[0.08] rounded-xl text-white outline-none focus:border-[#5B5CFF]/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-8">
                <button 
                  onClick={() => setExtendModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <GradientButton onClick={handleExtendSave} className="py-2 px-6">
                  Save Changes
                </GradientButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}





