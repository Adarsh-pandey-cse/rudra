"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, Bell } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { useDataStore } from "@/store/dataStore";
import { useHomeworkStore } from "@/store/homeworkStore";

import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";
import { cn } from "@/lib/utils";

const containerVariants: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants: any = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

export default function StudentHomeworkPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const { subjects } = useDataStore();
  const { getStudentAssignments, getSubmission } = useHomeworkStore();
  const assignmentsList = useHomeworkStore(state => state.assignments);
  const submissionsList = useHomeworkStore(state => state.submissions);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [newNotifCount, setNewNotifCount] = useState(0);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "student") {
      // router.replace("/auth/login"); /* Handled by DashboardLayout */
      return;
    }
    setIsLoading(false);

    // Count unread homework notifications
    if (currentUser?.id) {
      const notifs = JSON.parse(localStorage.getItem(`hw_notifications_${currentUser.id}`) || "[]");
      const unseen = notifs.filter((n: any) => !n.seen).length;
      setNewNotifCount(unseen);
    }
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  const allHomework = useMemo(() => {
    if (!currentUser) return [];
    return getStudentAssignments(currentUser.id).sort((a, b) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [currentUser, getStudentAssignments, assignmentsList, submissionsList]);

  if (!isAuthenticated || currentUser?.role !== "student" || isLoading) {
    return null;
  }

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

  const getComputedStatus = (hwId: string) => {
    const sub = getSubmission(hwId, currentUser.id);
    if (sub && sub.status !== "pending") return sub.status;
    const hw = allHomework.find(h => h.id === hwId);
    if (hw && new Date(hw.dueDate).getTime() < new Date().getTime()) return "missed";
    return sub ? sub.status : "pending";
  };

  const displayHomework = allHomework.filter(hw => {
    const status = getComputedStatus(hw.id);
    if (activeTab === "All") return true;
    if (activeTab === "Pending") return status === "pending" || status === "draft";
    if (activeTab === "Missed") return status === "missed";
    if (activeTab === "Submitted") return status === "submitted" || status === "resubmitted" || status === "ai_evaluating";
    if (activeTab === "Graded") return status === "ai_evaluated" || status === "teacher_reviewed" || status === "accepted" || status === "rejected" || status === "resubmission_requested";
    return status.toLowerCase() === activeTab.toLowerCase();
  }).sort((a, b) => {
    if (a.subjectId !== b.subjectId) return a.subjectId.localeCompare(b.subjectId);
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  console.log("DEBUG StudentHomeworkPage:", {
    currentUserId: currentUser?.id,
    allHomeworkCount: allHomework.length,
    allHomework: allHomework.map(h => ({ id: h.id, title: h.title, status: getComputedStatus(h.id) })),
    submissionsCount: submissionsList.length,
    activeTab
  });

  const getDueStatus = (dueDate: string, status: string) => {
    if (status !== "pending" && status !== "draft") return null;
    const diffMs = new Date(dueDate).getTime() - new Date().getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);
    if (diffMs < 0) return { label: "Overdue", color: "text-[#EF4444]" };
    if (diffHrs < 24) return { label: `${Math.round(diffHrs)}h left`, color: "text-[#FB923C]" };
    const days = Math.floor(diffHrs / 24);
    return { label: `${days}d left`, color: "text-[#22C55E]" };
  };

  const tabs = ["Pending", "All", "Missed", "Submitted", "Graded"];
  const pendingCount = allHomework.filter(h => {
    const st = getComputedStatus(h.id);
    return st === "pending" || st === "draft";
  }).length;

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-6xl mx-auto pb-24">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-[#5B5CFF]" />
              Homework
              {pendingCount > 0 && (
                <span className="text-xs bg-[#FB923C] text-white px-2 py-0.5 rounded-full font-medium">
                  {pendingCount} pending
                </span>
              )}
            </h1>
            <p className="text-sm text-[#B6C2D9] mt-1">Complete your assignments and track your grades.</p>
          </div>
          {newNotifCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#5B5CFF]/10 border border-[#5B5CFF]/20 rounded-[14px]">
              <Bell className="w-4 h-4 text-[#5B5CFF]" />
              <span className="text-xs text-[#5B5CFF] font-medium">{newNotifCount} new</span>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                activeTab === tab
                  ? "bg-white/10 text-white shadow-lg backdrop-blur-md border-white/20"
                  : "bg-white/5 text-[#7B8798] hover:bg-white/10 hover:text-[#B6C2D9] border-transparent"
              )}
            >
              {tab}
              {tab === "Pending" && pendingCount > 0 && (
                <span className="ml-1.5 text-[10px] bg-[#FB923C] text-white px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Homework Grid */}
        {displayHomework.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-12 h-12 text-[#7B8798]" />}
            title="No Homework Found"
            description={`You have no ${activeTab === "All" ? "" : activeTab.toLowerCase()} homework right now.`}
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {displayHomework.map((hw) => {
                const subjectName = getSubjectName(hw.subjectId);
                const computedStatus = getComputedStatus(hw.id);
                const isOverdue = new Date(hw.dueDate).getTime() < new Date().getTime() && computedStatus === "pending";
                const dueStatus = getDueStatus(hw.dueDate, computedStatus);

                return (
                  <motion.div
                    key={hw.id}
                    variants={itemVariants}
                    layout
                  >
                    <Link href={`/dashboard/student/homework/${hw.id}`}>
                      <GlassCard
                        hoverEffect
                        className={cn(
                          "h-full flex flex-col cursor-pointer border-l-4 relative overflow-hidden group",
                          (getComputedStatus(hw.id) === "teacher_reviewed" || getComputedStatus(hw.id) === "ai_evaluated" || getComputedStatus(hw.id) === "accepted") ? "border-l-[#22C55E]" :
                          (getComputedStatus(hw.id) === "rejected" || getComputedStatus(hw.id) === "missed" || isOverdue) ? "border-l-[#EF4444]" :
                          getComputedStatus(hw.id) === "resubmission_requested" ? "border-l-[#EAB308]" :
                          getComputedStatus(hw.id) === "submitted" ? "border-l-[#4F9DFF]" :
                          "border-l-[#5B5CFF]"
                        )}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col gap-1 flex-1 mr-2">
                            <span className="text-[11px] text-[#7B8798] uppercase tracking-wider font-medium">
                              {subjectName}
                            </span>
                            <h3 className="font-semibold text-white group-hover:text-[#5B5CFF] transition-colors line-clamp-2">
                              {hw.title}
                            </h3>
                          </div>
                          <StatusBadge
                            variant={
                              (getComputedStatus(hw.id) === "teacher_reviewed" || getComputedStatus(hw.id) === "ai_evaluated" || getComputedStatus(hw.id) === "accepted") ? "success" :
                              getComputedStatus(hw.id) === "submitted" ? "info" :
                              (getComputedStatus(hw.id) === "rejected" || getComputedStatus(hw.id) === "missed" || isOverdue) ? "error" :
                              "warning"
                            }
                          >
                            {getComputedStatus(hw.id).replace("_", " ")}
                          </StatusBadge>
                        </div>

                        {getComputedStatus(hw.id) === "missed" && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-[#EF4444] text-[#EF4444] uppercase font-black text-xl tracking-[0.2em] px-3 py-1 rounded-sm transform -rotate-[15deg] opacity-80 pointer-events-none z-10 shadow-sm shadow-red-500/20 bg-[#EF4444]/10">
                            MISSED
                          </div>
                        )}

                        {(() => {
                           const sub = getSubmission(hw.id, currentUser.id);
                           if (sub?.isLate && getComputedStatus(hw.id) !== "missed") {
                              return (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-[#EF4444] text-[#EF4444] uppercase font-black text-xl tracking-[0.2em] px-3 py-1 rounded-sm transform -rotate-[15deg] opacity-80 pointer-events-none z-10 shadow-sm shadow-red-500/20 bg-[#EF4444]/10">
                                  LATE
                                </div>
                              );
                           }
                           return null;
                        })()}

                        {/* Feedback snippet */}
                        {(() => {
                          const sub = getSubmission(hw.id, currentUser.id);
                          if (sub?.teacherFeedback) {
                            return (
                              <div className="mb-3 p-2.5 bg-[#5B5CFF]/5 border border-[#5B5CFF]/10 rounded-[10px] text-xs text-[#B6C2D9] line-clamp-2">
                                <span className="text-[#5B5CFF] font-semibold block mb-0.5">Teacher Feedback:</span>
                                {sub.teacherFeedback}
                              </div>
                            );
                          }
                          return null;
                        })()}

                        <div className="mt-auto pt-4 flex items-center justify-between text-[13px]">
                          {dueStatus ? (
                            <div className={cn("flex items-center gap-1.5 font-medium", dueStatus.color)}>
                              <Clock className="w-3.5 h-3.5" />
                              <span>{dueStatus.label}</span>
                            </div>
                          ) : (
                            <div className="text-[#7B8798] text-xs capitalize">{getComputedStatus(hw.id).replace("_", " ")}</div>
                          )}
                          <span className="text-[#7B8798] text-xs">{hw.difficulty}</span>
                        </div>

                        {(() => {
                          const status = getComputedStatus(hw.id);
                          const sub = getSubmission(hw.id, currentUser.id);
                          const isGraded = status === "ai_evaluated" || status === "teacher_reviewed" || status === "accepted";
                          
                          if (!isGraded || !sub) return null;
                          
                          let displayScore: string | null = null;
                          if (sub.teacherGrade !== null && sub.teacherGrade !== undefined) {
                            displayScore = `${sub.teacherGrade}/${hw.maxMarks}`;
                          } else if (sub.aiEvaluation?.percentage !== undefined) {
                            displayScore = `${sub.aiEvaluation.percentage}%`;
                          }

                          if (!displayScore) return null;

                          return (
                            <div className="absolute top-0 right-0 px-3 py-1 bg-[#22C55E]/20 text-[#22C55E] text-xs font-bold rounded-bl-xl border-b border-l border-[#22C55E]/30 flex items-center gap-1 shadow-sm backdrop-blur-sm">
                              <span>⭐</span> {displayScore}
                            </div>
                          );
                        })()}
                      </GlassCard>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

