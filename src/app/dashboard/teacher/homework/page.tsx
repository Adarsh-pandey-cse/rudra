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
  const [extendHours, setExtendHours] = useState("1");
  const [assignmentToExtend, setAssignmentToExtend] = useState<any>(null);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<any>(null);
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState<any>("published");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      router.replace("/auth/login");
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
    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
    const matchesClass = classFilter === "all" || assignment.classId === classFilter;
    return matchesStatus && matchesClass;
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

  const handleExtendSave = () => {
    if (assignmentToExtend) {
      const currentDue = new Date(assignmentToExtend.dueDate);
      const newDue = new Date(currentDue.getTime() + parseInt(extendHours) * 60 * 60 * 1000);
      updateAssignment(assignmentToExtend.id, {
        dueDate: newDue.toISOString(),
        dueTime: `${newDue.getHours().toString().padStart(2, '0')}:${newDue.getMinutes().toString().padStart(2, '0')}`
      });
      setExtendModalOpen(false);
      setAssignmentToExtend(null);
      setExtendHours("1");
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
            {["all", "published", "draft", "scheduled"].map(tab => (
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
                <motion.div key={assignment.id} variants={itemVariants} layout onClick={() => router.push(`/dashboard/teacher/homework/analytics/${assignment.id}`)} className="cursor-pointer">
                  <GlassCard hoverEffect className="p-6 flex flex-col h-full group relative overflow-visible border-white/[0.08] hover:border-[#5B5CFF]/40 transition-colors">
                    {/* Background decoration */}
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-[#5B5CFF]/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:from-[#5B5CFF]/20 transition-colors" />
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-[14px] bg-white/[0.06] flex items-center justify-center text-2xl border border-white/[0.08] shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                          <SubjectIcon iconName={subject?.icon || 'book'} className="w-6 h-6 text-[#B6C2D9]" />
                        </div>
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            {(() => {
                               const assignedCount = ((assignment as any).assignedTo || (assignment as any).recipientStudentIds || []).length;
                               const subCount = getAssignmentSubmissions(assignment.id).length;
                               const isAllSubmitted = assignedCount > 0 && subCount === assignedCount;
                               return (
                                 <StatusBadge variant={isAllSubmitted ? "success" : getStatusVariant(assignment.status)} dot className="capitalize">
                                   {isAllSubmitted ? "Submitted by All" : assignment.status}
                                 </StatusBadge>
                               );
                            })()}
                            {assignment.classId && (
                              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/[0.05] text-[#7B8798] border border-white/[0.05]">
                                {assignment.classId.replace("class-", "Class ")}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-[#5B5CFF] transition-colors pr-2" title={assignment.title}>{assignment.title}</h3>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : assignment.id);
                          }}
                          className="p-2 -mr-2 text-[#7B8798] hover:text-white rounded-[14px] hover:bg-white/[0.06] transition-colors shrink-0 z-20 relative"
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
                              className="absolute right-0 top-full mt-2 w-36 bg-[#0B1527] border border-white/[0.08] rounded-xl shadow-2xl py-1 z-50 overflow-hidden"
                            >
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    router.push(`/dashboard/teacher/homework/edit/${assignment.id}`);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-[#B6C2D9] hover:bg-white/[0.06] hover:text-white flex items-center gap-2"
                                >
                                  <Edit3 className="w-4 h-4" /> Edit
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    setAssignmentToExtend(assignment);
                                    setExtendModalOpen(true);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-[#B6C2D9] hover:bg-[#5B5CFF]/10 hover:text-[#5B5CFF] flex items-center gap-2"
                                >
                                  <Clock className="w-4 h-4" /> Extend Deadline
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    setAssignmentToDelete(assignment);
                                    setDeleteModalOpen(true);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-[#EF4444] hover:bg-[#EF4444]/10 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="mb-6 relative z-10">
                      <p className="text-sm text-[#B6C2D9] line-clamp-2 mb-4 leading-relaxed h-10">{assignment.topicTitle}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-[12px] bg-[#4F9DFF]/10 border border-[#4F9DFF]/20 text-[11px] font-semibold text-[#4F9DFF]">
                          {(assignment as any).maxGrade || (assignment as any).maxMarks || 0} Marks
                        </span>
                        {assignment.evaluationMethod !== "Teacher Only" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-[12px] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[11px] font-semibold text-[#8B5CF6]">
                            <BrainCircuit className="w-3.5 h-3.5 mr-1.5" /> AI Grading
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/[0.08] flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2 text-[13px] text-[#7B8798]">
                        <Calendar className="w-4 h-4 text-[#5B5CFF]" />
                        <span className={cn("font-medium", new Date(assignment.dueDate) < new Date() ? 'text-[#EF4444]' : '')}>
                          {new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(assignment.dueDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] text-[#7B8798] bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/[0.05]">
                        <Users className="w-4 h-4 text-[#4F9DFF]" />
                        <span className="font-bold text-white">{getAssignmentSubmissions(assignment.id).length}</span>
                        <span className="opacity-60">/ {((assignment as any).assignedTo || (assignment as any).recipientStudentIds || []).length}</span>
                      </div>
                    </div>
                  </GlassCard>
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
                  <label className="block text-sm font-medium text-[#B6C2D9] mb-1.5">Extend by (Hours)</label>
                  <select
                    value={extendHours}
                    onChange={(e) => setExtendHours(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0B1527] border border-white/[0.08] rounded-xl text-white outline-none focus:border-[#5B5CFF]/50 transition-all"
                  >
                    {[...Array(24)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1} {i === 0 ? 'Hour' : 'Hours'}</option>
                    ))}
                  </select>
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
