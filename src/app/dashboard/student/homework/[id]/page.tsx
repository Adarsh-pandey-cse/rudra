"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Clock, CheckCircle, BrainCircuit,
  ChevronRight, ChevronLeft, Send, AlertTriangle, BookOpen, X,
  Paperclip, Camera, UploadCloud, Download, MessageCircleQuestion
} from "lucide-react";
import confetti from "canvas-confetti";

import { useAuthStore } from "@/store/authStore";
import { useHomeworkStore } from "@/store/homeworkStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import GlassButton from "@/components/ui/GlassButton";
import EmptyState from "@/components/ui/EmptyState";
import type { GeneratedQuestion, Submission, Attachment } from "@/types/homework-types";
import { format } from "date-fns";
import { uploadService } from "@/lib/services/upload.service";

export default function StudentHomeworkDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const homeworkId = params.id as string;

  const { currentUser, isAuthenticated, _hasHydrated, users } = useAuthStore();
  const { getAssignment, getSubmission, submitMCQAnswers, saveSubmissionDraft, submitHomework } = useHomeworkStore();

  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // MCQ Quiz State
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Subjective Assignment State
  const [studentAttachments, setStudentAttachments] = useState<Attachment[]>([]);
  const [textResponse, setTextResponse] = useState("");
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const allAssignments = useHomeworkStore(state => state.assignments);
  const allSubmissions = useHomeworkStore(state => state.submissions);
  
  const homework = getAssignment(homeworkId);
  const submission = getSubmission(homeworkId, currentUser?.id || "");
  const teacher = homework ? users.find(u => u.id === homework.teacherId) : null;
  const isStarted = started || submission?.status === "resubmission_requested" || submission?.status === "rejected";

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "student") {
      // router.replace("/auth/login"); /* Handled by DashboardLayout */
      return;
    }
    setMounted(true);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  useEffect(() => {
    if (submission) {
      if (submission.attachments) {
        setStudentAttachments(submission.attachments);
      }
      if (submission.textResponse) {
        setTextResponse(submission.textResponse);
      }
    }
  }, [submission]);

  if (!mounted || !currentUser) return null;

  if (!homework) {
    return (
      <DashboardLayout role="student">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <EmptyState
            icon={<AlertTriangle className="w-12 h-12 text-[#EF4444]" />}
            title="Assignment Not Found"
            description="This assignment may have been deleted or is unavailable."
            action={
              <GlassButton onClick={() => router.push("/dashboard/student/homework")}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Homework
              </GlassButton>
            }
          />
        </div>
      </DashboardLayout>
    );
  }

  const questions = homework.questions || [];
  const isCompleted = submission?.status === "submitted" || submission?.status === "resubmitted" || submission?.status === "teacher_reviewed" || submission?.status === "ai_evaluated" || submission?.status === "accepted";
  const needsResubmission = submission?.status === "rejected" || submission?.status === "resubmission_requested";
  const mcqQuestions = questions.filter(q => q.type === "mcq" || (q.options?.length ?? 0) > 0);
  const isSubjective = mcqQuestions.length === 0;
  
  const currentQuestion = mcqQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === mcqQuestions.length - 1;
  const progressPercent = mcqQuestions.length > 0 ? ((currentQuestionIndex) / mcqQuestions.length) * 100 : 0;

  // -- MCQ Handlers --
  const handleSelectOption = (opt: string) => {
    if (isCompleted) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: opt }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < mcqQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitMCQ = async () => {
    if (Object.keys(answers).length < mcqQuestions.length) {
      if (!confirm("You have unanswered questions. Are you sure you want to submit?")) return;
    }
    
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Smooth UX delay
      await submitMCQAnswers(homework.id, currentUser.id, answers);
      triggerSuccess();
    } catch (err: any) {
      console.error("MCQ Submission failed:", err);
      alert("Failed to submit: " + (err.message || err.toString()));
    } finally {
      setIsSubmitting(false);
    }
  };

  // -- Subjective Handlers --
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const filesArray = Array.from(files);
      const uploadedFiles = await uploadService.uploadFiles(
        filesArray,
        "homework",
        "homework",
        homework.id
      );

      const newAttachments: Attachment[] = uploadedFiles.map((f, i) => ({
        id: `att_${Date.now()}_${i}`,
        name: f.name,
        url: f.url,
        type: 'image',
        size: f.size || 0,
        uploadedAt: new Date().toISOString()
      }));

      const updatedAttachments = [...studentAttachments, ...newAttachments];
      setStudentAttachments(updatedAttachments);
      
      // Auto-save draft
      if (!isCompleted) {
        await saveSubmissionDraft(homework.id, currentUser.id, textResponse, updatedAttachments);
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      alert("Failed to upload files: " + (err.message || err.toString()));
    }
  };

  const removeStudentAttachment = async (id: string) => {
    const updatedAttachments = studentAttachments.filter(a => a.id !== id);
    setStudentAttachments(updatedAttachments);
    if (!isCompleted) {
      await saveSubmissionDraft(homework.id, currentUser.id, textResponse, updatedAttachments);
    }
  };
  
  const handleTextChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTextResponse(newText);
    if (!isCompleted) {
      await saveSubmissionDraft(homework.id, currentUser.id, newText, studentAttachments);
    }
  };

  const handleSubmitSubjective = async () => {
    if (studentAttachments.length === 0 && !textResponse.trim()) {
      if (!confirm("You haven't attached any files or written a response. Submit anyway?")) return;
    }
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload
      await saveSubmissionDraft(homework.id, currentUser.id, textResponse, studentAttachments);
      await submitHomework(homework.id, currentUser.id);
      triggerSuccess();
    } catch (err: any) {
      console.error("Submission failed:", err);
      alert("Failed to submit: " + (err.message || err.toString()));
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerSuccess = () => {
    try {
      if (typeof confetti === "function") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#5B5CFF', '#8B5CF6', '#22C55E']
        });
      } else {
        (confetti as any)?.default?.({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#5B5CFF', '#8B5CF6', '#22C55E']
        });
      }
    } catch (e) {
      console.warn("Confetti failed:", e);
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="max-w-4xl mx-auto space-y-6 pb-24">
        {/* Navigation */}
        <button
          onClick={() => router.push("/dashboard/student/homework")}
          className="flex items-center text-[13px] font-medium text-[#7B8798] hover:text-[#B6C2D9] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to all assignments
        </button>

        {/* Not Started State */}
        {!isStarted && !isCompleted ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-8 text-center relative overflow-hidden border-[#5B5CFF]/20">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#5B5CFF]/10 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="w-20 h-20 bg-[#5B5CFF]/10 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 border border-[#5B5CFF]/20">
                <BookOpen className="w-10 h-10 text-[#5B5CFF]" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-2 relative z-10">{homework.title}</h1>
              <p className="text-[#B6C2D9] mb-6 relative z-10">
                Topic: {homework.topicTitle} • {isSubjective ? 'Subjective Assignment' : `${mcqQuestions.length} Questions`}
              </p>
              
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8 relative z-10">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] rounded-[12px] border border-white/[0.08]">
                  <Clock className="w-4 h-4 text-[#FB923C]" />
                  <span className="text-sm text-white">Due: {format(new Date(homework.dueDate), "MMM d, yyyy")}</span>
                </div>
                {!isSubjective && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] rounded-[12px] border border-white/[0.08]">
                    <CheckCircle className="w-4 h-4 text-[#22C55E]" />
                    <span className="text-sm text-white">Auto Evaluated</span>
                  </div>
                )}
                {submission?.isLate && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#EF4444]/10 rounded-[12px] border border-[#EF4444]/30">
                    <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                    <span className="text-sm font-bold text-[#EF4444] uppercase tracking-wider">Late</span>
                  </div>
                )}
              </div>

              {needsResubmission && (
                <div className={`mb-6 p-4 rounded-xl border relative z-10 flex flex-col gap-2 ${submission?.status === "rejected" ? "bg-[#EF4444]/10 border-[#EF4444]/30" : "bg-[#EAB308]/10 border-[#EAB308]/30"}`}>
                  <div className={`flex items-center gap-2 font-bold ${submission?.status === "rejected" ? "text-[#EF4444]" : "text-[#EAB308]"}`}>
                    <AlertTriangle className="w-5 h-5" />
                    {submission?.status === "rejected" ? "Assignment Rejected" : "Resubmission Required"}
                  </div>
                  <p className="text-sm text-white">
                    {submission?.status === "rejected" ? "Your teacher has rejected this assignment." : "Your teacher has requested a resubmission for this homework."}
                  </p>
                  {submission?.teacherFeedback && (
                    <div className={`mt-2 p-3 bg-black/20 rounded-lg text-sm text-[#B6C2D9] border-l-2 ${submission?.status === "rejected" ? "border-[#EF4444]" : "border-[#EAB308]"}`}>
                      <span className="font-semibold block mb-1">Reason / Feedback:</span>
                      {submission.teacherFeedback}
                    </div>
                  )}
                </div>
              )}

              {/* Show Teacher Attachments before starting if any */}
              {homework.attachments && homework.attachments.length > 0 && (
                <div className="mb-8 relative z-10">
                  <h3 className="text-sm font-medium text-[#7B8798] mb-3 uppercase tracking-wider">Reference Materials</h3>
                  <div className="flex gap-3 justify-center overflow-x-auto pb-2">
                    {homework.attachments.map((attachment, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setViewingAttachment(attachment)}
                        className="relative w-28 h-28 rounded-[14px] bg-[#131D2E] border border-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0 group hover:border-[#5B5CFF]/50 transition-colors cursor-pointer text-left focus:outline-none"
                      >
                        {attachment.type === 'image' ? (
                          <div className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: `url(${attachment.url})` }} />
                        ) : (
                          <div className="flex flex-col items-center p-2 text-center">
                            <Paperclip className="w-6 h-6 text-[#7B8798] mb-2 group-hover:text-[#5B5CFF] transition-colors" />
                            <span className="text-[10px] text-[#B6C2D9] truncate w-full px-1 group-hover:text-white transition-colors">{attachment.name}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <GradientButton onClick={() => setStarted(true)} className="px-12 py-3 text-lg font-bold relative z-10">
                {isSubjective ? 'Open Assignment' : 'Start Quiz'}
              </GradientButton>
            </GlassCard>
          </motion.div>
        ) : (
          /* Active Assignment State */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.04] p-4 rounded-[16px] border border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-white">{homework.title}</h1>
                  {submission?.isLate && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 uppercase">Late</span>
                  )}
                </div>
                <p className="text-sm text-[#B6C2D9]">
                  {isSubjective ? 'Subjective Assignment' : `Question ${currentQuestionIndex + 1} of ${mcqQuestions.length}`}
                </p>
              </div>
              
              {!isSubjective && !isCompleted && (
                <div className="w-full md:w-64">
                  <div className="flex justify-between text-xs text-[#7B8798] mb-2 font-medium">
                    <span>Progress</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#5B5CFF] to-[#8B5CF6]" 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
              
              {isCompleted && submission?.aiEvaluation && !isSubjective && (
                <div className="px-4 py-2 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-[12px]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#22C55E] block mb-0.5">Score</span>
                  <span className="text-xl font-bold text-white">{submission.aiEvaluation.percentage}%</span>
                </div>
              )}
              {isCompleted && isSubjective && submission && (
                <div className="flex gap-3">
                  {submission.status === "accepted" && (
                    <div className="relative px-6 py-3 rounded-2xl overflow-hidden border border-[#EAB308]/40 shadow-[0_0_20px_rgba(234,179,8,0.15)] group">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#EAB308]/10 via-[#D97706]/10 to-[#8B5CF6]/10" />
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay" />
                      
                      <div className="relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r from-[#EAB308] to-[#FCD34D] block mb-1">Points Rewarded</span>
                        <div className="flex items-center gap-4">
                          <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-[#FDE047] via-[#EAB308] to-[#D97706] drop-shadow-lg filter whitespace-nowrap">
                            {submission.teacherGrade ?? "-"} <span className="text-xl text-[#EAB308]/70">/ {homework.maxMarks}</span>
                          </span>
                          <div className="border-2 border-[#EAB308] text-[#EAB308] text-[10px] uppercase tracking-[0.2em] font-black px-2 py-0.5 rounded-sm transform -rotate-12 opacity-90 select-none shadow-[0_0_10px_rgba(234,179,8,0.3)] bg-black/40 backdrop-blur-sm">Certified</div>
                        </div>
                      </div>
                      
                      {/* Shine effect */}
                      <div className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10 group-hover:animate-shine" />
                    </div>
                  )}
                  {submission.status === "rejected" && (
                    <div className="px-4 py-2 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-[12px]">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#EF4444] block mb-0.5">Status</span>
                      <span className="text-lg font-bold text-white">Rejected</span>
                    </div>
                  )}
                  {submission.status === "resubmission_requested" && (
                    <div className="px-4 py-2 bg-[#EAB308]/10 border border-[#EAB308]/30 rounded-[12px]">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#EAB308] block mb-0.5">Status</span>
                      <span className="text-lg font-bold text-white">Resubmit Req.</span>
                    </div>
                  )}
                  {submission.status === "submitted" && (
                    <div className="px-4 py-2 bg-[#5B5CFF]/10 border border-[#5B5CFF]/30 rounded-[12px]">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#5B5CFF] block mb-0.5">Status</span>
                      <span className="text-lg font-bold text-white">Submitted</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Teacher Feedback (if available) */}
            {isCompleted && isSubjective && submission?.teacherFeedback && (
              <GlassCard className="p-6 border-[#5B5CFF]/30 bg-[#5B5CFF]/5">
                <div className="flex items-center gap-3 mb-4">
                  {teacher?.avatar ? (
                    teacher.avatar.length < 10 ? (
                      <div className="w-10 h-10 rounded-full bg-[#5B5CFF]/20 border border-[#5B5CFF]/30 flex items-center justify-center font-bold text-white shadow-sm">
                        {teacher.avatar}
                      </div>
                    ) : (
                      <img src={teacher.avatar} alt={teacher.name} className="w-10 h-10 rounded-full object-cover border border-[#5B5CFF]/30 shadow-sm" />
                    )
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#5B5CFF]/20 border border-[#5B5CFF]/30 flex items-center justify-center font-bold text-white shadow-sm">
                      {teacher?.name?.substring(0, 2).toUpperCase() || "T"}
                    </div>
                  )}
                  <div>
                    <h2 className="text-sm font-semibold text-[#5B5CFF] uppercase tracking-wider">Teacher Feedback</h2>
                    <p className="text-xs text-[#B6C2D9] font-medium">{teacher?.name || "Teacher"}</p>
                  </div>
                </div>
                <p className="text-[#E2E8F0] whitespace-pre-wrap leading-relaxed bg-[#0B0F19]/40 p-4 rounded-xl border border-white/5">{submission.teacherFeedback}</p>
              </GlassCard>
            )}

            {/* Teacher Attachments / Instructions (Always visible during subjective) */}
            {isSubjective && (
              <GlassCard className="p-6">
                <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#5B5CFF]" /> Assignment Instructions
                </h2>
                <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl mb-6">
                  <div 
                    className="text-[#B6C2D9] whitespace-pre-wrap leading-relaxed text-sm prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: homework.instructions || homework.description || "No specific instructions provided." }}
                  />
                </div>

                {homework.attachments && homework.attachments.length > 0 && (
                  <div>
                    <h3 className="text-[13px] font-medium text-[#7B8798] mb-3 uppercase tracking-wider">Reference Files</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {homework.attachments.map((attachment, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setViewingAttachment(attachment)}
                          className="relative w-32 h-32 rounded-[14px] bg-[#131D2E] border border-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0 group hover:border-[#5B5CFF]/50 transition-colors cursor-pointer text-left focus:outline-none"
                        >
                          {attachment.type === 'image' ? (
                            <div className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: `url(${attachment.url})` }} />
                          ) : (
                            <div className="flex flex-col items-center p-2 text-center">
                              <Paperclip className="w-8 h-8 text-[#7B8798] mb-2 group-hover:text-[#5B5CFF] transition-colors" />
                              <span className="text-[11px] text-[#B6C2D9] truncate w-full px-2 group-hover:text-white transition-colors">{attachment.name}</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>
            )}

            {/* Subjective Submission Area */}
            {isSubjective && (
              <GlassCard className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-white mb-6">Your Submission</h2>
                
                {!isCompleted && submission?.status === "rejected" && (
                  <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-left">
                    <h4 className="text-sm font-semibold text-[#EF4444] mb-2 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Submission Rejected
                    </h4>
                    <p className="text-sm text-white leading-relaxed">
                      {submission.teacherFeedback || "Your submission was rejected. Please review your work and resubmit."}
                    </p>
                  </div>
                )}

                {!isCompleted && submission?.status === "resubmission_requested" && (
                  <div className="mb-6 p-4 bg-[#EAB308]/10 border border-[#EAB308]/30 rounded-xl text-left">
                    <h4 className="text-sm font-semibold text-[#EAB308] mb-2 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Resubmission Requested
                    </h4>
                    <p className="text-sm text-white leading-relaxed">
                      {submission.teacherFeedback || "Your teacher requested changes. Please update your work and resubmit."}
                    </p>
                  </div>
                )}

                {/* Text Response Area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#B6C2D9] mb-2 uppercase tracking-wider">
                  Text Response (Optional)
                </label>
                <textarea
                  value={textResponse}
                  onChange={handleTextChange}
                  disabled={isCompleted}
                  placeholder={isCompleted ? "" : "Type your answer here..."}
                  className="w-full bg-[#07111F] border border-white/[0.1] rounded-xl p-4 text-white placeholder-[#7B8798] min-h-[120px] focus:outline-none focus:border-[#4F9DFF]/50 transition-colors resize-y disabled:opacity-50"
                />
              </div>

              {studentAttachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                    {studentAttachments.map((att) => (
                      <div key={att.id} className="relative group">
                        <button
                          onClick={() => setViewingAttachment(att)}
                          className="w-full aspect-square rounded-xl bg-[#131D2E] border border-white/[0.08] flex items-center justify-center overflow-hidden hover:border-[#5B5CFF]/50 transition-colors focus:outline-none"
                        >
                          {att.type === 'image' ? (
                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${att.url})` }} />
                          ) : (
                            <div className="flex flex-col items-center p-2 text-center">
                              <Paperclip className="w-6 h-6 text-[#7B8798] mb-2" />
                              <span className="text-[10px] text-[#B6C2D9] truncate w-full px-1">{att.name}</span>
                            </div>
                          )}
                        </button>
                        {!isCompleted && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeStudentAttachment(att.id); }}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!isCompleted ? (
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const target = e.dataTransfer; if (target.files && target.files.length > 0) handleFileChange({ target } as any); }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full flex-1 border-2 border-dashed rounded-[14px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragging ? "border-[#4F9DFF] bg-[#4F9DFF]/10" : "border-white/[0.12] hover:bg-white/[0.04]"}`}
                    >
                      <div className="p-3 bg-white/[0.04] rounded-full mb-3">
                        <UploadCloud className={`w-5 h-5 ${isDragging ? "text-[#4F9DFF]" : "text-[#7B8798]"}`} />
                      </div>
                      <p className="text-sm text-white mb-1">Drag & drop images or click to upload</p>
                      <p className="text-[11px] text-[#7B8798] uppercase tracking-wider font-medium">Images accepted</p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-center mt-4">
                      <GlassButton 
                        onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                        className="flex-1 sm:flex-none border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/10 text-[#8B5CF6]"
                      >
                        <Camera className="w-4 h-4 mr-2" /> Take Photo
                      </GlassButton>
                    </div>
                    
                    <GradientButton 
                      onClick={handleSubmitSubjective} 
                      disabled={isSubmitting} 
                      className="w-full sm:w-auto px-8"
                    >
                      {isSubmitting ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mx-auto" />
                      ) : (
                        <span className="flex items-center justify-center">Submit Work <Send className="w-4 h-4 ml-2" /></span>
                      )}
                    </GradientButton>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl text-center text-[#22C55E] flex flex-col items-center justify-center gap-2">
                      <CheckCircle className="w-8 h-8 mb-1" />
                      <span className="font-medium">Successfully Submitted</span>
                      {submission?.teacherGrade !== null && submission?.teacherGrade !== undefined && (
                        <span className="text-sm text-white bg-[#22C55E]/20 px-3 py-1 rounded-full mt-2">
                          Grade: {submission.teacherGrade} / {homework.maxMarks}
                        </span>
                      )}
                    </div>
                    {submission?.teacherFeedback && (
                      <div className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl text-left">
                        <h4 className="text-sm font-semibold text-[#B6C2D9] mb-2 uppercase tracking-wider flex items-center gap-2">
                          <MessageCircleQuestion className="w-4 h-4 text-[#4F9DFF]" /> Teacher Feedback
                        </h4>
                        <p className="text-sm text-white leading-relaxed">
                          {submission.teacherFeedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Hidden inputs for Subjective uploads */}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
                <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
              </GlassCard>
            )}

            {/* MCQ Quiz Area */}
            {!isSubjective && currentQuestion && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="w-8 h-8 rounded-full bg-[#5B5CFF]/20 flex items-center justify-center text-sm font-bold text-[#5B5CFF]">
                        Q{currentQuestionIndex + 1}
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-white/[0.04] text-[#B6C2D9] uppercase tracking-wider border border-white/[0.08]">
                        {currentQuestion.marks} Mark(s)
                      </span>
                    </div>
                    
                    <h2 className="text-lg md:text-xl font-medium text-white mb-8 leading-relaxed">
                      {currentQuestion.question}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentQuestion.options?.map((opt, i) => {
                        const isSelected = answers[currentQuestion.id] === opt;
                        
                        let optionClasses = "";
                        let showCorrectIcon = false;
                        let showWrongIcon = false;

                        if (isCompleted) {
                          const isCorrectAnswer = currentQuestion.correctAnswer === opt;
                          if (isCorrectAnswer) {
                            optionClasses = "bg-[#22C55E]/20 border-[#22C55E]/50 text-white shadow-[0_0_15px_rgba(34,197,94,0.15)]";
                            showCorrectIcon = true;
                          } else if (isSelected && !isCorrectAnswer) {
                            optionClasses = "bg-[#EF4444]/20 border-[#EF4444]/50 text-white";
                            showWrongIcon = true;
                          } else {
                            optionClasses = "bg-white/[0.02] border-white/[0.06] text-[#7B8798] opacity-50";
                          }
                        } else {
                          optionClasses = isSelected 
                            ? "bg-[#5B5CFF]/20 border-[#5B5CFF]/50 text-white shadow-[0_0_15px_rgba(91,92,255,0.15)]" 
                            : "bg-white/[0.04] border-white/[0.08] text-[#B6C2D9] hover:bg-white/[0.08] hover:border-white/[0.2]";
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => handleSelectOption(opt)}
                            disabled={isCompleted}
                            className={`p-4 rounded-[14px] border transition-all text-left flex items-start gap-3 ${optionClasses}`}
                          >
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected && !isCompleted ? "border-[#5B5CFF] bg-[#5B5CFF]" :
                              showCorrectIcon ? "border-[#22C55E] bg-[#22C55E]" :
                              showWrongIcon ? "border-[#EF4444] bg-[#EF4444]" :
                              "border-[#7B8798] bg-transparent"
                            }`}>
                              {showCorrectIcon ? <CheckCircle className="w-4 h-4 text-white" /> :
                               showWrongIcon ? <X className="w-4 h-4 text-white" /> :
                               (isSelected && !isCompleted) && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-[15px] font-medium flex-1">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* AI Explanation */}
                    {isCompleted && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-6 p-4 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-[14px]"
                      >
                        <h3 className="text-sm font-semibold text-[#8B5CF6] flex items-center gap-2 mb-2">
                          <BrainCircuit className="w-4 h-4" /> AI Explanation
                        </h3>
                        <p className="text-sm text-[#B6C2D9] leading-relaxed">
                          {currentQuestion.solution || "No explanation provided for this question."}
                        </p>
                      </motion.div>
                    )}
                  </GlassCard>
                </motion.div>
              </AnimatePresence>
            )}

            {/* MCQ Navigation Controls */}
            {!isSubjective && (
              <div className="flex justify-between items-center pt-2">
                <GlassButton onClick={handlePrev} disabled={currentQuestionIndex === 0} className="px-6">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </GlassButton>
                
                {!isCompleted && isLastQuestion ? (
                  <GradientButton onClick={handleSubmitMCQ} disabled={isSubmitting} className="px-8 flex items-center">
                    {isSubmitting ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Submit Answers
                  </GradientButton>
                ) : (
                  <GradientButton onClick={handleNext} disabled={isLastQuestion} className="px-6">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </GradientButton>
                )}
              </div>
            )}

            {/* Pagination Dots for MCQ */}
            {!isSubjective && (
              <div className="flex justify-center gap-1.5 mt-8">
                {mcqQuestions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      idx === currentQuestionIndex ? "bg-[#5B5CFF]" :
                      answers[mcqQuestions[idx].id] ? "bg-[#5B5CFF]/40" :
                      "bg-white/[0.1]"
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Full Screen Attachment Viewer Modal */}
      <AnimatePresence>
        {viewingAttachment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl h-[85vh] bg-[#0F172A] border border-white/[0.1] rounded-[24px] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#131D2E]">
                <h3 className="text-white font-medium flex items-center gap-2 truncate pr-4">
                  <Paperclip className="w-4 h-4 text-[#7B8798] flex-shrink-0" /> 
                  <span className="truncate">{viewingAttachment.name}</span>
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a 
                    href={viewingAttachment.url} 
                    download={viewingAttachment.name} 
                    className="p-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-full text-white transition-colors"
                    title="Download"
                  >
                     <Download className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => setViewingAttachment(null)} 
                    className="p-2 bg-white/[0.05] hover:bg-[#EF4444] rounded-full text-white transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-[#07111F] flex items-center justify-center p-4">
                {viewingAttachment.type === 'image' || viewingAttachment.url.startsWith('data:image/') ? (
                  <img src={viewingAttachment.url} alt={viewingAttachment.name} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                ) : (
                  <iframe src={`${viewingAttachment.url}#navpanes=0`} className="w-full h-full border-0 rounded-lg bg-white" title={viewingAttachment.name} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}
