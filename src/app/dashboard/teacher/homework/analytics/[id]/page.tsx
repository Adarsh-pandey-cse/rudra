"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Clock, CheckCircle, BrainCircuit, Users,
  BarChart3, AlertTriangle, BookOpen, Star, FileText,
  Paperclip, X, Download, MessageSquare
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { useHomeworkStore } from "@/store/homeworkStore";
import { useNotificationStore } from "@/store/notificationStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import GlassButton from "@/components/ui/GlassButton";
import InlineFileViewer from "@/components/ui/InlineFileViewer";
import ZoomableImage from "@/components/ui/ZoomableImage";
import EmptyState from "@/components/ui/EmptyState";
import CircularProgress from "@/components/dashboard/CircularProgress";
import type { Attachment, Submission } from "@/types/homework-types";

export default function HomeworkAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const homeworkId = params.id as string;

  const { currentUser, isAuthenticated, _hasHydrated, getAllUsers } = useAuthStore();
  const { teacherReview, getSubmission } = useHomeworkStore();
  const allAssignments = useHomeworkStore(state => state.assignments);
  const allSubmissions = useHomeworkStore(state => state.submissions);
  
  const homework = allAssignments.find(a => a.id === homeworkId);
  const submissions = allSubmissions.filter(s => s.assignmentId === homeworkId);

  const [mounted, setMounted] = useState(false);
  
  // Modals state
  const [viewingAttachment, setViewingAttachment] = useState<any>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<{sub: Submission, student: any} | null>(null);
  const [teacherGrade, setTeacherGrade] = useState<string | number>("");
  const [teacherFeedback, setTeacherFeedback] = useState<string>("");
  const [reviewFilter, setReviewFilter] = useState<"all" | "needs_review">("all");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      // router.replace("/auth/login"); /* Handled by DashboardLayout */
      return;
    }
    setMounted(true);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  if (!mounted || !currentUser) return null;



  if (!homework) {
    return (
      <DashboardLayout role="teacher">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <EmptyState
            icon={<AlertTriangle className="w-12 h-12 text-[#EF4444]" />}
            title="Assignment Not Found"
            description="This assignment may have been deleted."
            action={
              <GlassButton onClick={() => router.push("/dashboard/teacher/homework")}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Homework
              </GlassButton>
            }
          />
        </div>
      </DashboardLayout>
    );
  }

  const allUsers = getAllUsers();
  const assignedStudentIds = homework?.recipientStudentIds?.length 
    ? homework.recipientStudentIds 
    : allUsers.filter(u => u.role === "student" && ((u as any).classId === homework?.classId || (u as any).grade === homework?.classId?.replace("class-", ""))).map(u => u.id);

  // Analytics Math
  const totalAssigned = assignedStudentIds.length || 1;
  const submittedCount = submissions.filter(s => s.status !== "not_started" && s.status !== "draft").length;
  const submissionRate = Math.round((submittedCount / totalAssigned) * 100);
  
  const isSubjective = !homework?.questions || homework.questions.length === 0 || (homework.questions.filter(q => q.type === "mcq").length === 0);
  const isPureMCQ = homework?.questions && homework.questions.length > 0 && homework.questions.every(q => q.type === "mcq");

  const evaluatedSubmissions = submissions.filter(s => s.aiEvaluation);
  const teacherEvaluatedSubmissions = submissions.filter(s => s.status === "accepted" || s.status === "rejected" || s.status === "resubmission_requested" || s.status === "teacher_reviewed" || (s.teacherGrade !== null && s.teacherGrade !== undefined));
  
  // Robust needs review count: submissions that are submitted but not yet evaluated/graded
  const needsReviewCount = submissions.filter(s => s.status === "submitted" || s.status === "resubmitted" || s.status === "ai_evaluating").length;

  const maxMarks = homework?.maxMarks || 20;
  const gradedSubmissions = submissions.filter(s => s.status === "accepted" && s.teacherGrade !== null && s.teacherGrade !== undefined);
  
  // Total graded or evaluated submissions
  const gradedCount = submissions.filter(s => 
    s.status === "accepted" || 
    s.status === "rejected" || 
    s.status === "resubmission_requested" || 
    s.status === "teacher_reviewed" || 
    s.status === "ai_evaluated"
  ).length;

  const avgScore = !isPureMCQ 
    ? (gradedSubmissions.length > 0 
        ? Math.round((gradedSubmissions.reduce((sum, s) => sum + (s.teacherGrade || 0), 0) / (gradedSubmissions.length * maxMarks)) * 100)
        : 0)
    : (evaluatedSubmissions.length > 0 
        ? Math.round(evaluatedSubmissions.reduce((sum, s) => sum + (s.aiEvaluation?.percentage || 0), 0) / evaluatedSubmissions.length)
        : 0);

  // Weak topics (aggregate from AI evaluations)
  const allWeakTopics = evaluatedSubmissions.flatMap(s => s.aiEvaluation?.weakTopics || []);
  const topicCounts = allWeakTopics.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {} as Record<string, number>);
  const topWeakTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

  const handleOpenSubmission = (sub: Submission, student: any) => {
    setSelectedSubmission({sub, student});
    setTeacherGrade(sub.teacherGrade ?? (sub.aiEvaluation?.suggestedMarks || ""));
    setTeacherFeedback(sub.teacherFeedback || "");
    if (sub.attachments && sub.attachments.length > 0) {
      setViewingAttachment(sub.attachments[0]);
    } else {
      setViewingAttachment(null);
    }
  };

  const handleSaveGrade = async (status: "accepted" | "rejected" | "resubmission_requested") => {
    if (!selectedSubmission) return;
    
    // Prevent double submissions
    if ((selectedSubmission.sub as any).isSaving) return;
    (selectedSubmission.sub as any).isSaving = true;

    const gradeVal = teacherGrade === "" ? null : Number(teacherGrade);
    
    try {
      // Save to store
      await teacherReview(selectedSubmission.sub.id, gradeVal, teacherFeedback, status);
      
      // Close the modal directly to force live reliance on store and give a perfect workflow
      setSelectedSubmission(null);
    } catch (error: any) {
      alert(error.message || "Failed to submit review.");
    } finally {
      delete (selectedSubmission.sub as any).isSaving;
    }
  };

  const handleRemind = (studentId: string, studentName: string) => {
    useNotificationStore.getState().addNotification({
      recipientId: studentId,
      title: "Homework Reminder",
      message: `Your teacher has reminded you to submit the homework: "${homework.title}".`,
      link: `/dashboard/student/homework/${homeworkId}`
    });
    // Visual feedback
    const btn = document.getElementById(`remind-btn-${studentId}`);
    if (btn) {
      const origText = btn.innerText;
      btn.innerText = "Reminded!";
      btn.classList.add("text-[#22C55E]", "bg-[#22C55E]/10");
      setTimeout(() => {
        btn.innerText = origText;
        btn.classList.remove("text-[#22C55E]", "bg-[#22C55E]/10");
      }, 2000);
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="max-w-6xl mx-auto space-y-6 pb-24">
        {/* Navigation */}
        <button
          onClick={() => router.push("/dashboard/teacher/homework")}
          className="flex items-center text-[13px] font-medium text-[#7B8798] hover:text-[#B6C2D9] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to all assignments
        </button>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{homework.title}</h1>
            <p className="text-[#B6C2D9] text-sm flex items-center gap-2">
              Class {homework.classId.replace("class-", "")} â€¢ Topic: {homework.topicTitle}
              {isSubjective && <span className="px-2 py-0.5 rounded bg-[#4F9DFF]/20 text-[#4F9DFF] text-xs font-semibold ml-2 border border-[#4F9DFF]/30">Subjective</span>}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <GlassButton onClick={() => router.push(`/dashboard/teacher/homework/edit/${homework.id}`)}>
              Edit Assignment
            </GlassButton>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-5 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-[#4F9DFF]" />
              <span className="text-sm font-semibold text-[#B6C2D9]">Submission Rate</span>
            </div>
            <div className="text-3xl font-bold text-white flex items-baseline gap-2">
              {submissionRate}%
              <span className="text-sm font-medium text-[#7B8798]">{submittedCount}/{totalAssigned} Students</span>
            </div>
          </GlassCard>
          
          <GlassCard className="p-5 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-[#22C55E]" />
              <span className="text-sm font-semibold text-[#B6C2D9]">Average Score</span>
            </div>
            <div className="text-3xl font-bold text-white flex items-baseline gap-2">
              {avgScore}%
              <span className="text-sm font-medium text-[#22C55E]">+4% from last week</span>
            </div>
          </GlassCard>

          <GlassCard className="p-5 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              {!isPureMCQ ? (
                <>
                  <CheckCircle className="w-5 h-5 text-[#22C55E]" />
                  <span className="text-sm font-semibold text-[#B6C2D9]">Graded by Teacher</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-5 h-5 text-[#8B5CF6]" />
                  <span className="text-sm font-semibold text-[#B6C2D9]">Evaluated by AI</span>
                </>
              )}
            </div>
            <div className="text-3xl font-bold text-white flex items-baseline gap-2">
              {gradedCount}
              <span className="text-sm font-medium text-[#7B8798]">Submissions</span>
            </div>
          </GlassCard>
          
          <GlassCard 
            className={`p-5 flex flex-col justify-center cursor-pointer transition-all ${reviewFilter === "needs_review" ? "border-[#FB923C] bg-gradient-to-br from-[#FB923C]/20 to-[#FB923C]/5" : "border-[#FB923C]/30 bg-gradient-to-br from-[#FB923C]/5 to-transparent hover:border-[#FB923C]/60"}`}
            onClick={() => setReviewFilter(f => f === "needs_review" ? "all" : "needs_review")}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#FB923C]" />
                <span className="text-sm font-semibold text-[#FB923C]">Needs Review</span>
              </div>
              {reviewFilter === "needs_review" && (
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#FB923C] bg-[#FB923C]/20 px-2 py-0.5 rounded-full">Filtering</span>
              )}
            </div>
            <div className="text-3xl font-bold text-white">
              {needsReviewCount}
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Assignment Context Card */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#4F9DFF]" /> Assignment Details & Questions
              </h2>
              <div className="space-y-4">
                {homework.description && (
                  <div className="text-sm text-[#B6C2D9] leading-relaxed prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: homework.description }} />
                )}
                {homework.attachments && homework.attachments.length > 0 && (
                  <div className="flex flex-col gap-4 pt-2">
                    {homework.attachments.map(att => {
                      const isImage = att.type === 'image' || att.url.match(/\.(jpeg|jpg|gif|png)$/i) != null;
                      return isImage ? (
                        <div key={att.id} className="relative group rounded-xl overflow-hidden border border-white/[0.1] bg-[#131D2E] inline-block max-w-[400px]">
                          <ZoomableImage src={att.url} alt={att.name} className="w-full h-auto object-cover" />
                        </div>
                      ) : (
                        <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-[#4F9DFF]/10 text-[#4F9DFF] hover:bg-[#4F9DFF]/20 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 border border-[#4F9DFF]/20 w-fit">
                          <Paperclip className="w-4 h-4" /> {att.name}
                        </a>
                      );
                    })}
                  </div>
                )}
                {homework.questions && homework.questions.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-semibold text-white">Questions ({homework.questions.length})</h3>
                    {homework.questions.map((q, i) => (
                      <div key={q.id} className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                        <p className="text-sm text-white font-medium mb-2">Q{i + 1}. {q.question}</p>
                        {q.options && q.options.length > 0 && (
                          <ul className="list-disc pl-5 text-sm text-[#B6C2D9] space-y-1 mt-2">
                            {q.options.map((opt, oi) => <li key={oi}>{opt}</li>)}
                          </ul>
                        )}
                        <p className="text-xs text-[#22C55E] mt-3 font-semibold">Correct Answer: {q.correctAnswer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#5B5CFF]" /> Student Submissions
              </h2>
              
              <div className="space-y-3">
                {assignedStudentIds.map(studentId => {
                  const student = allUsers.find(u => u.id === studentId);
                  const storeSub = getSubmission(homeworkId, studentId);
                  // Force live sync: if this student is currently being edited in the modal, use the live modal state!
                  const sub = (selectedSubmission?.sub.studentId === studentId) ? selectedSubmission.sub : storeSub;
                  
                  if (!student) return null;
                  
                  const isSubmitted = sub && (sub.status !== "not_started" && sub.status !== "draft");
                  const needsGrading = isSubmitted && (sub.status === "submitted" || sub.status === "resubmitted" || sub.status === "ai_evaluating");

                  if (reviewFilter === "needs_review" && !needsGrading) return null;
                  
                  let cardBorder = "border-white/[0.06]";
                  let cardBg = "bg-white/[0.02] hover:bg-white/[0.04]";
                  let gradeColor = "text-[#5B5CFF]";
                  let borderColor = "border-[#5B5CFF]";
                  
                  if (sub?.isLate) {
                    cardBorder = "border-[#EF4444]/40";
                    cardBg = "bg-[#EF4444]/5 hover:bg-[#EF4444]/10";
                  }
                  
                  if (isSubjective && sub && sub.teacherGrade !== null && sub.teacherGrade !== undefined && sub.status !== "resubmission_requested" && sub.status !== "rejected") {
                    const grade = sub.teacherGrade;
                    if (grade < 10) { cardBorder = "border-[#EF4444]/40"; cardBg = "bg-[#EF4444]/5 hover:bg-[#EF4444]/10"; gradeColor = "text-[#EF4444]"; borderColor = "border-[#EF4444]"; }
                    else if (grade >= 10 && grade < 12) { cardBorder = "border-[#FB923C]/40"; cardBg = "bg-[#FB923C]/5 hover:bg-[#FB923C]/10"; gradeColor = "text-[#FB923C]"; borderColor = "border-[#FB923C]"; }
                    else if (grade >= 12 && grade <= 16) { cardBorder = "border-[#3B82F6]/40"; cardBg = "bg-[#3B82F6]/5 hover:bg-[#3B82F6]/10"; gradeColor = "text-[#3B82F6]"; borderColor = "border-[#3B82F6]"; }
                    else if (grade > 16) { cardBorder = "border-[#22C55E]/40"; cardBg = "bg-[#22C55E]/5 hover:bg-[#22C55E]/10"; gradeColor = "text-[#22C55E]"; borderColor = "border-[#22C55E]"; }
                  }
                  
                  return (
                    <div key={studentId} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-[14px] transition-colors relative overflow-hidden ${cardBg} ${cardBorder}`}>
                      {sub?.isLate && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-[#EF4444] text-[#EF4444] uppercase font-black text-xl tracking-[0.2em] px-3 py-1 rounded-sm transform -rotate-[15deg] opacity-20 pointer-events-none z-0">
                          LATE
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-3 sm:mb-0 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] flex items-center justify-center text-white font-bold shrink-0">
                          {student.avatar ? <img src={student.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (student.name || "S").substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{student.name}</p>
                          <div className="text-xs text-[#7B8798]">
                            {isSubmitted ? (
                              <div className="flex flex-col gap-1 mt-1">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-[#22C55E]" /> Submitted {new Date(sub.submittedAt || "").toLocaleDateString()}</span>
                                  {sub.isLate && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 uppercase">Late</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="flex items-center gap-1.5 mt-1"><Clock className="w-3 h-3 text-[#FB923C]" /> Not submitted yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {isSubmitted && (
                          <div className="flex flex-col items-end">
                            {isSubjective ? (
                              (sub.status === "accepted" || sub.status === "rejected" || sub.status === "resubmission_requested" || (sub.teacherGrade !== null && sub.teacherGrade !== undefined)) ? (
                                <>
                                  <span className="text-xs text-[#7B8798] uppercase tracking-wider font-medium">
                                    {sub.status === "rejected" ? "Status" : sub.status === "resubmission_requested" ? "Status" : "Grade"}
                                  </span>
                                  {sub.status === "rejected" ? (
                                    <span className="text-sm font-bold text-[#EF4444]">Rejected</span>
                                  ) : sub.status === "resubmission_requested" ? (
                                    <span className="text-sm font-bold text-[#EAB308]">Resubmit Req.</span>
                                  ) : (
                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3">
                                      {sub.status === "accepted" && (
                                        <div className={`border-2 text-[10px] uppercase tracking-[0.2em] font-black px-1.5 py-0.5 rounded-sm transform -rotate-6 opacity-90 select-none ${borderColor} ${gradeColor}`}>
                                          Checked
                                        </div>
                                      )}
                                      <span className={`text-xl font-bold whitespace-nowrap ${gradeColor}`}>{sub.teacherGrade ?? "-"} / {maxMarks}</span>
                                    </div>
                                  )}
                                </>
                              ) : sub.status === "resubmitted" ? (
                                <span className="text-xs font-semibold text-[#5B5CFF] bg-[#5B5CFF]/10 px-2 py-1 rounded border border-[#5B5CFF]/30">Resubmitted</span>
                              ) : (
                                <span className="text-xs font-semibold text-[#FB923C] bg-[#FB923C]/10 px-2 py-1 rounded border border-[#FB923C]/30">Needs Grading</span>
                              )
                            ) : (
                              sub.aiEvaluation && (
                                <>
                                  <span className="text-xs text-[#7B8798] uppercase tracking-wider font-medium">AI Score</span>
                                  <span className={`text-lg font-bold ${
                                    sub.aiEvaluation.percentage >= 80 ? "text-[#22C55E]" :
                                    sub.aiEvaluation.percentage >= 60 ? "text-[#EAB308]" : "text-[#EF4444]"
                                  }`}>{sub.aiEvaluation.percentage}%</span>
                                </>
                              )
                            )}
                          </div>
                        )}
                        
                        <GlassButton 
                          id={`remind-btn-${studentId}`}
                          className={`px-4 py-2 text-xs transition-all flex items-center gap-2 ${isSubmitted && !needsGrading ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20 hover:bg-[#22C55E]/20" : ""}`} 
                          onClick={() => isSubmitted ? handleOpenSubmission(sub, student) : handleRemind(studentId, student.name)}
                          disabled={false}
                        >
                          {isSubmitted ? (
                            <>
                              {!needsGrading && <CheckCircle className="w-3.5 h-3.5" />} 
                              View Submission
                            </>
                          ) : "Remind"}
                        </GlassButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          {/* AI Insights Sidebar */}
          <div className="space-y-6">
            <GlassCard className="p-6 border-[#8B5CF6]/30 bg-gradient-to-b from-[#8B5CF6]/10 to-[#07111F]">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-[#8B5CF6]" />
                Class Insights
              </h3>
              <p className="text-sm text-[#B6C2D9] mb-6">AI analysis across all submitted homework.</p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-[#7B8798] uppercase tracking-wider mb-3">Top Weaknesses</h4>
                  {topWeakTopics.length > 0 ? (
                    <div className="space-y-2">
                      {topWeakTopics.map((topic, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 bg-white/[0.04] border border-[#EF4444]/20 rounded-[10px]">
                          <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                          <span className="text-sm text-white">{topic}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#B6C2D9] italic">Not enough data yet.</p>
                  )}
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold text-[#7B8798] uppercase tracking-wider mb-3">AI Recommendation</h4>
                  <div className="p-4 bg-white/[0.04] border border-[#2DD4BF]/20 rounded-[12px]">
                    <p className="text-sm text-[#B6C2D9] leading-relaxed">
                      "Consider reviewing <strong className="text-white">{topWeakTopics[0] || homework.topicTitle}</strong> in the next class. Most students struggled with the application questions in this area."
                    </p>
                  </div>
                </div>

                <GradientButton className="w-full">
                  Generate Remedial Quiz
                </GradientButton>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Submission Detail Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full sm:max-w-[1200px] sm:w-[95vw] h-[95dvh] sm:h-[85vh] max-h-[900px] bg-[#0B1527] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-[#131D2E] shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg">
                    {selectedSubmission.student.avatar ? <img src={selectedSubmission.student.avatar} alt="" className="w-full h-full rounded-full" /> : selectedSubmission.student.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedSubmission.student.name}'s Submission</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-[#7B8798]">Submitted: {new Date(selectedSubmission.sub.submittedAt || "").toLocaleString()}</p>
                      {selectedSubmission.sub.isLate && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 uppercase">Late</span>
                      )}
                    </div>
                    {selectedSubmission.sub.status === "accepted" && selectedSubmission.sub.teacherReviewedAt && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-xs font-bold text-[#22C55E] mt-0.5 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Accepted: {new Date(selectedSubmission.sub.teacherReviewedAt).toLocaleString()}
                      </motion.p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 text-[#7B8798] hover:text-[#EF4444] bg-white/[0.05] hover:bg-[#EF4444]/10 rounded-full transition-colors flex items-center gap-2"
                >
                  <span className="text-xs font-semibold">Close Grading</span>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
                <div className="w-full lg:w-[60%] border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#07111F] flex flex-col relative min-h-[50vh] lg:min-h-0 lg:h-full shrink-0 overflow-hidden isolate z-0">
                  {selectedSubmission.sub.attachments && selectedSubmission.sub.attachments.length > 0 ? (
                    <>
                      <div className="p-3 border-b border-white/[0.08] flex gap-2 overflow-x-auto bg-[#131D2E] shrink-0">
                        {selectedSubmission.sub.attachments.map((att, idx) => (
                           <button
                             key={att.id}
                             onClick={() => setViewingAttachment(att)}
                             className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${viewingAttachment?.id === att.id ? "bg-[#5B5CFF] text-white" : "bg-white/[0.05] text-[#7B8798] hover:text-white"}`}
                           >
                             <Paperclip className="w-3 h-3" /> Page {idx + 1}
                           </button>
                        ))}
                      </div>
                      <div className="flex-1 overflow-hidden p-4 flex items-center justify-center relative">
                        {viewingAttachment ? (
                          <InlineFileViewer 
                            url={viewingAttachment.url}
                            name={viewingAttachment.name}
                            type={viewingAttachment.type || (viewingAttachment.url.startsWith("data:image/") ? "image" : "other")}
                          />
                        ) : (
                          <div className="text-center text-[#7B8798]">
                            <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Select an attachment above to view</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-[#7B8798]">
                      No attachments provided.
                    </div>
                  )}
                </div>

                {/* Right Side: Grading Form */}
                <div className="w-full lg:w-[40%] flex flex-col bg-[#0B1527] shrink-0 lg:flex-1 lg:overflow-hidden">
                  <div className="lg:flex-1 lg:overflow-y-auto p-4 lg:p-6 space-y-6">

                    {/* Assignment Context */}
                    <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-3">
                      <h3 className="text-sm font-bold text-[#B6C2D9] uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#4F9DFF]" /> Assignment Details
                      </h3>
                      <div className="text-sm text-white leading-relaxed" dangerouslySetInnerHTML={{ __html: homework.description }} />
                      {homework.attachments && homework.attachments.length > 0 && (
                        <div className="flex flex-col gap-4 mt-2">
                          {homework.attachments.map(att => {
                            const isImage = att.type === 'image' || att.url.match(/\.(jpeg|jpg|gif|png)$/i) != null;
                            return isImage ? (
                              <div key={att.id} className="relative group rounded-xl overflow-hidden border border-white/[0.1] bg-[#131D2E] inline-block max-w-full">
                                <ZoomableImage src={att.url} alt={att.name} className="w-full h-auto" />
                              </div>
                            ) : (
                              <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-[#4F9DFF]/10 text-[#4F9DFF] hover:bg-[#4F9DFF]/20 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 border border-[#4F9DFF]/20 w-fit">
                                <Paperclip className="w-4 h-4" /> {att.name}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Student Text Response */}
                    {selectedSubmission.sub.textResponse && (
                      <div className="p-4 bg-[#4F9DFF]/5 border border-[#4F9DFF]/20 rounded-xl space-y-3">
                        <h3 className="text-sm font-bold text-[#4F9DFF] uppercase tracking-wider flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Student Text Response
                        </h3>
                        <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{selectedSubmission.sub.textResponse}</p>
                      </div>
                    )}


                    {/* MCQ Question Results if available */}
                    {selectedSubmission.sub.aiEvaluation?.questionResults && (
                      <div>
                         <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                          <BrainCircuit className="w-4 h-4 text-[#8B5CF6]" /> AI Evaluation Details
                        </h3>
                        <div className="space-y-3">
                          {selectedSubmission.sub.aiEvaluation.questionResults.map((qr: any, idx: number) => {
                            const q = homework.questions?.find(hq => hq.id === qr.questionId);
                            return (
                              <div key={idx} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm">
                                <p className="text-white font-medium mb-2 leading-snug">Q{idx + 1}: {q?.question}</p>
                                <div className="flex items-center gap-4 text-xs mb-2">
                                  <span className="text-[#B6C2D9]">Answer: <span className={qr.isCorrect ? "text-[#22C55E] font-bold" : "text-[#EF4444] font-bold"}>{qr.studentAnswer}</span></span>
                                  {!qr.isCorrect && <span className="text-[#22C55E] font-bold">Correct: {q?.correctAnswer}</span>}
                                </div>
                                <p className="text-[11px] text-[#7B8798]">{qr.feedback}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Fixed Grading Section at Bottom Right */}
                  <div className="p-4 pb-32 lg:pb-5 lg:p-5 border-t border-white/[0.08] bg-[#131D2E] shrink-0">
                    <div className="flex items-end justify-between gap-4 mb-4">
                      <div className="w-full">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#7B8798] mb-1">Grade (/{maxMarks})</label>
                        <input 
                          type="number"
                          value={teacherGrade}
                          onChange={(e) => {
                            if (e.target.value === "") { setTeacherGrade(""); return; }
                            const val = Number(e.target.value);
                            if (val > maxMarks) { setTeacherGrade(maxMarks); }
                            else if (val < 0) { setTeacherGrade(0); }
                            else { setTeacherGrade(val); }
                          }}
                          max={maxMarks}
                          min={0}
                          className="w-full px-4 py-2 bg-[#0B1527] border border-white/[0.1] rounded-xl text-white font-bold text-lg outline-none focus:border-[#5B5CFF] transition-colors"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#7B8798] mb-1">Feedback</label>
                      <textarea 
                        value={teacherFeedback}
                        onChange={(e) => setTeacherFeedback(e.target.value)}
                        placeholder="Constructive feedback or reason for rejection..."
                        rows={2}
                        className="w-full px-3 py-2 bg-[#0B1527] border border-white/[0.1] rounded-xl text-white outline-none focus:border-[#5B5CFF] transition-colors resize-none text-sm"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                       <GradientButton 
                        type="button"
                        onClick={() => handleSaveGrade("accepted")} 
                        className="w-full py-2.5 flex items-center justify-center gap-2"
                        disabled={Number(teacherGrade) > maxMarks || Number(teacherGrade) < 0}
                      >
                        <CheckCircle className="w-4 h-4" /> 
                        {selectedSubmission.sub.status === "accepted" ? "Update Grade" : "Accept & Grade"}
                      </GradientButton>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => handleSaveGrade("resubmission_requested")}
                          className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors border text-[#EAB308] bg-[#EAB308]/10 hover:bg-[#EAB308]/20 border-[#EAB308]/30 cursor-pointer"
                        >
                          {selectedSubmission.sub.status === "resubmission_requested" ? "Update Request" : "Request Resubmission"}
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleSaveGrade("rejected")}
                          className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors border text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border-[#EF4444]/30 cursor-pointer"
                        >
                          {selectedSubmission.sub.status === "rejected" ? "Update Rejection" : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}


