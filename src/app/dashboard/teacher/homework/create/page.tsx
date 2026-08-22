"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Sparkles, CheckCircle2, Brain, Upload, X, FileText, 
  Image as ImageIcon, ChevronDown, Calendar, Users, 
  Plus, AlertCircle, Wand2, BookOpen, Search, Edit3, Save, Eye,
  ChevronRight, BookMarked, Settings, Clock, Link as LinkIcon
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import RichTextEditor from "@/components/ui/RichTextEditor";
import StatusBadge from "@/components/ui/StatusBadge";
import { uploadService } from "@/lib/services/upload.service";
import UploadProgressRing from "@/components/ui/UploadProgressRing";
import { useHomeworkStore } from "@/store/homeworkStore";
import { useAuthStore } from "@/store/authStore";
import { useDataStore } from "@/store/dataStore";
import { BOARDS, CLASSES, getSubjectsForClass } from "@/data/curriculum-index";
import type { Student } from "@/types";
import type { TopicSearchResult } from "@/types/homework-types";
import { cn } from "@/lib/utils";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const stepVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0 })
};

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Adaptive"];
const QUESTION_TYPES = ["Worksheet", "Practice Questions", "MCQ", "Project", "Lab Work", "Activity", "Revision", "AI Generated Worksheet", "Mixed"];
const EVAL_METHODS = ["Teacher Only", "Teacher + AI", "AI Suggestion + Teacher Final"];

interface AttachmentFile {
  id: string;
  file: File;
  preview?: string;
  name: string;
  size: string;
  type: string;
}

export default function CreateHomeworkPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated, getAllUsers } = useAuthStore();
  const { searchCurriculum, createAssignment, generateQuestions } = useHomeworkStore();

  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [step, setStep] = useState<"wizard" | "generating" | "review" | "done">("wizard");
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [geminiError, setGeminiError] = useState("");

  // Step 1: Target Class
  const [selectedClass, setSelectedClass] = useState("10");

  // Step 2: Curriculum
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [topic, setTopic] = useState("");

  // Step 3: Details & Setup
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Worksheet");
  const [difficulty, setDifficulty] = useState("Medium");
  const [estimatedTime, setEstimatedTime] = useState("30");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); 
    d.setHours(d.getHours() + 24); 
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [allowLate, setAllowLate] = useState(false);
  const [lateWindow, setLateWindow] = useState("24");

  // Step 4: Intelligent Student Selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState("All");

  // Step 5: Evaluation & AI Settings
  const [evaluationMethod, setEvaluationMethod] = useState("AI Suggestion + Teacher Final");
  const [aiSettings, setAiSettings] = useState({
    ocr: true, handwriting: true, conceptDetection: true,
    grammarCheck: false, diagramCheck: false, formulaCheck: true, similarityDetection: true, aiFeedback: true
  });
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // AI Generated Questions (for Review Step)
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      // router.replace("/auth/login"); /* Handled by DashboardLayout */
      return;
    }
    setMounted(true);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  useEffect(() => {
    if (!currentUser) return;
    const allStudentsInClass = getAllUsers().filter(
      (u): u is Student => u.role === "student" && (u as Student).status !== "archived" && (u as Student).status !== "deleted" && ((u as Student).grade === `Class ${selectedClass}` || (u as Student).classId === `class-${selectedClass}`)
    );
    setSelectedStudentIds(allStudentsInClass.map(s => s.id));
    const subjectsForClass = getSubjectsForClass(selectedClass);
    if (subjectsForClass.length > 0 && !subjectsForClass.find(s => s.id === selectedSubjectId)) {
      setSelectedSubjectId(subjectsForClass[0].id);
      setSelectedSubjectName(subjectsForClass[0].name);
    }
  }, [selectedClass, getAllUsers, currentUser]);



  const allStudentsInClass = mounted ? getAllUsers().filter(
    (u): u is Student => {
      if (u.role !== "student") return false;
      const s = u as Student;
      if (s.status === "archived" || s.status === "deleted") return false;
      
      const sClassId = String(s.classId || "").toLowerCase();
      const sGrade = String(s.grade || "").toLowerCase();
      const selected = String(selectedClass).toLowerCase();
      
      return sGrade === selected || 
             sGrade === `class ${selected}` || 
             sGrade === `${selected}th` || 
             sClassId === `class-${selected}` ||
             sGrade.replace(/\D/g, '') === selected.replace(/\D/g, '');
    }
  ) : [];

  const filteredStudents = allStudentsInClass.filter(s => {
    if (studentFilter !== "All") {
      // Mock filters for demonstration
      if (studentFilter === "Weak Students" && Math.random() > 0.3) return false;
      if (studentFilter === "Top Performers" && Math.random() > 0.3) return false;
    }
    return s.name.toLowerCase().includes(studentSearch.toLowerCase());
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newAttachments: AttachmentFile[] = Array.from(files).map(file => ({
      id: `att_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      file,
      name: file.name,
      size: file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.type,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files); };
  const removeAttachment = (id: string) => setAttachments(prev => prev.filter(a => a.id !== id));
  const getFileIcon = (type: string) => type.startsWith("image/") ? <ImageIcon className="w-4 h-4 text-[#4F9DFF]" /> : <FileText className="w-4 h-4 text-[#FB923C]" />;

  const nextStep = () => {
    if (currentStep === 2 && !topic.trim()) { setGeminiError("Please select a topic."); return; }
    if (currentStep === 3 && !title.trim()) { setGeminiError("Please enter a title."); return; }
    setGeminiError("");
    setDirection(1);
    setCurrentStep(prev => Math.min(prev + 1, 6));
  };
  const prevStep = () => { setDirection(-1); setCurrentStep(prev => Math.max(prev - 1, 1)); };

  const handleGenerate = async () => {
    if (type !== "AI Generated Worksheet" && type !== "Practice Questions" && type !== "MCQ" && type !== "Mixed") {
      // If it's not an AI generated type, skip generation
      handlePublish(false);
      return;
    }

    if (!topic.trim()) { setGeminiError("Topic is missing."); return; }
    setGeminiError(""); setStep("generating"); setGeneratingProgress(0);

    const interval = setInterval(() => setGeneratingProgress(p => Math.min(p + 10, 85)), 300);

    try {
      const apiKey = typeof window !== "undefined" ? localStorage.getItem("rudra_gemini_api_key") : null;
      let questions: any[] = [];

      if (apiKey) {
        const distribution: Record<string, number> = { mcq: 5, very_short: 2, short: 2, long: 1, hots: 1, competency: 0, application: 0, diagram: 0 };
        const qConfig = {
          topicId: topic.toLowerCase().replace(/\s/g, "-"),
          topicTitle: topic,
          subject: selectedSubjectName || "General",
          difficulty: difficulty as any,
          distribution,
        };
        questions = await generateQuestions(qConfig as any);
      } else {
        // Mock questions
        questions = Array.from({ length: 10 }).map((_, i) => ({
          id: `q_mock_${i}`,
          type: type === "MCQ" ? "mcq" : (i % 2 === 0 ? "mcq" : "short"),
          question: `Sample intelligent mock question ${i + 1} for ${topic}?`,
          options: (type === "MCQ" || i % 2 === 0) ? ["Option A", "Option B", "Option C", "Option D"] : [],
          correctAnswer: "Option A",
          solution: "Mock step by step solution.",
          marks: (type === "MCQ" || i % 2 === 0) ? 1 : 2,
          bloomLevel: "Understand",
          expectedTimeMinutes: 2,
          conceptsCovered: [topic],
          isEdited: false
        }));
      }

      setGeneratedQuestions(questions);
      clearInterval(interval); setGeneratingProgress(100);
      
      setTimeout(() => {
        if (type === "AI Generated Worksheet" || type === "MCQ") {
          setStep("review");
        } else {
          handlePublish(true);
        }
      }, 500);
    } catch (err: any) {
      clearInterval(interval); setGeminiError(err.message || "Failed to generate."); setStep("wizard");
    }
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async (hasGeneratedQs = true) => {
    if (isPublishing) return;
    if (!selectedClass) {
      alert("Please select a class before publishing.");
      setGeminiError("Please select a class before publishing.");
      setStep("wizard");
      return;
    }
    
    setIsPublishing(true);
    try {
      const maxGrade = hasGeneratedQs ? generatedQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0) : 20;

      const assignmentId = `hw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      
      const newAssignment = {
        id: assignmentId,
        title: title || `${topic} - ${type}`,
        subjectId: selectedSubjectId || "gen",
        topicId: topic.toLowerCase().replace(/\s/g, "-"),
        topicTitle: topic,
        type: type as any,
        difficulty: difficulty as any,
        description: description || "",
        teacherId: currentUser!.id,
        assignedBy: currentUser!.id,
        assignedDate: new Date().toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        dueTime: dueDate.split("T")[1] || "23:59",
        maxMarks: maxGrade,
        recipientStudentIds: selectedStudentIds,
        classId: `class-${selectedClass}`,
        publishMode: "immediate",
        status: "uploading", // local optimistic state
        evaluationMethod: evaluationMethod as any,
        allowLateSubmission: allowLate,
        lateWindowHours: parseInt(lateWindow as any) || 24,
        aiSettings,
        questions: generatedQuestions,
        answerKey: [],
        attachments: [], 
        rubric: "",
        allowResubmission: true,
        requiresTeacherApproval: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Optimistic UI update (add to store locally)
      const { addLocalAssignment, createRemoteAssignment, updateAssignment } = useHomeworkStore.getState();
      addLocalAssignment(newAssignment as any);
      
      setStep("done");
      setIsPublishing(false);

      // 2. Background Pipeline (Non-blocking)
      (async () => {
        try {
          const filesToUpload = attachments.filter(a => a.file).map(a => a.file as File);
          let uploadedAttachments: any[] = [];
          
          if (filesToUpload.length > 0) {
            // UploadFiles automatically tracks progress via uploadStore
            const uploadedFiles = await uploadService.uploadFiles(
              filesToUpload,
              "homework",
              "homework",
              assignmentId
            );
            
            uploadedAttachments = uploadedFiles.map(f => ({
              id: Math.random().toString(),
              name: f.name,
              type: f.type.startsWith("image/") ? "image" : f.type.includes("pdf") ? "pdf" : "docx",
              url: f.url,
              size: f.size,
              uploadedAt: new Date().toISOString()
            }));
          }

          // 3. Firestore Transaction (Write only after uploads succeed)
          const finalAssignment = {
            ...newAssignment,
            status: "published", // now fully published
            attachments: uploadedAttachments
          };
          await createRemoteAssignment(finalAssignment as any);

          // Emit event to notify students
          import("@/lib/eventBus").then(({ eventBus }) => {
            eventBus.emit({
              type: 'HOMEWORK_ASSIGNED',
              payload: {
                assignmentId: finalAssignment.id,
                teacherId: finalAssignment.teacherId,
                studentIds: finalAssignment.recipientStudentIds,
                title: finalAssignment.title
              }
            });
          });

        } catch (err: any) {
          console.error("[Upload Pipeline] Background upload failed:", err);
          // Revert optimistic status to failed
          updateAssignment(assignmentId, { status: "failed" as any });
        }
      })();

    } catch (err: any) {
      console.error("Failed to process publish:", err);
      alert("Error publishing: " + (err.message || err.toString()));
      setGeminiError(err.message || "An error occurred while publishing.");
      setStep("wizard");
    } finally {
      setIsPublishing(false);
    }
  };

  if (!mounted || !currentUser) return null;

  const inputClasses = "w-full bg-white/[0.04] border border-white/[0.08] rounded-[14px] px-4 py-3 text-sm text-white placeholder:text-[#7B8798] focus:outline-none focus:ring-2 focus:ring-[#5B5CFF]/50 transition-all";
  const labelClasses = "text-[11px] text-[#7B8798] uppercase tracking-wider font-medium block mb-2";
  const STEPS = ["Class", "Curriculum", "Details", "Students", "AI & Files", "Publish"];

  return (
    <DashboardLayout role="teacher">
      <motion.div className="max-w-4xl mx-auto space-y-6 pb-24" variants={containerVariants} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <button onClick={() => { if (step === "review") setStep("wizard"); else router.back(); }} className="p-2 rounded-[14px] bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-[#7B8798] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#8B5CF6]" /> Homework Engine v2.0
            </h1>
            <p className="text-sm text-[#B6C2D9] mt-1">High-efficiency, AI-integrated assignment creation.</p>
          </div>
        </motion.div>

        {/* Done State */}
        <AnimatePresence>
          {step === "done" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }} className="w-24 h-24 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/30 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-[#22C55E]" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Homework Published!</h2>
              <p className="text-[#B6C2D9] text-sm mb-2">Assignment assigned to <span className="text-white font-semibold">{selectedStudentIds.length} students</span> in Class {selectedClass}.</p>
              <p className="text-[#7B8798] text-xs mb-8">Push notifications sent to all assigned students.</p>
              <div className="flex gap-3">
                <GlassButton onClick={() => router.push("/dashboard/teacher/homework")}>View All Homework</GlassButton>
                <GradientButton onClick={() => { setStep("wizard"); setCurrentStep(1); setTopic(""); setTitle(""); setAttachments([]); }}>
                  <Plus className="w-4 h-4 mr-1" /> Create Another
                </GradientButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generating State */}
        <AnimatePresence>
          {step === "generating" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-16 h-16 rounded-full border-2 border-t-[#8B5CF6] border-r-[#5B5CFF] border-b-transparent border-l-transparent mb-6" />
              <h2 className="text-xl font-bold text-white mb-2">Generating AI Homework...</h2>
              <p className="text-[#B6C2D9] text-sm mb-6">Gemini AI is crafting questions from the CBSE curriculum.</p>
              <div className="w-64 bg-white/[0.06] rounded-full h-2 overflow-hidden">
                <motion.div className="h-2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#5B5CFF]" initial={{ width: "0%" }} animate={{ width: `${generatingProgress}%` }} transition={{ duration: 0.3 }} />
              </div>
              <p className="text-[#7B8798] text-xs mt-2">{generatingProgress}% complete</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review State */}
        <AnimatePresence>
          {step === "review" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between bg-white/[0.04] p-4 rounded-[14px] border border-[#5B5CFF]/30">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2"><Eye className="w-5 h-5 text-[#5B5CFF]" /> Review Generated Questions</h2>
                  <p className="text-[#B6C2D9] text-sm mt-1">Review, edit, or adjust marks before publishing.</p>
                </div>
                <GradientButton onClick={() => handlePublish(true)} disabled={isPublishing} className="px-6 py-2.5">
                  {isPublishing ? "Publishing..." : "Publish Assignment"}
                </GradientButton>
              </div>
              <div className="space-y-4">
                {generatedQuestions.map((q, idx) => {
                  const isEditing = editingQuestionId === q.id;
                  return (
                    <GlassCard key={q.id} className={`p-5 transition-all ${isEditing ? "border-[#8B5CF6]/50 shadow-[0_0_20px_rgba(139,92,246,0.1)]" : ""}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">{idx + 1}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-[#8B5CF6]/20 text-[#8B5CF6]">{q.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-[#7B8798] font-medium mr-2">{q.marks} Marks</div>
                          <button onClick={() => setEditingQuestionId(isEditing ? null : q.id)} className={`p-1.5 rounded-lg transition-colors ${isEditing ? "bg-[#5B5CFF]/20 text-[#5B5CFF]" : "bg-white/[0.04] text-[#7B8798] hover:text-white"}`}>
                            {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      {!isEditing ? (
                        <div className="ml-9">
                          <p className="text-white text-[15px] leading-relaxed">{q.question}</p>
                          {q.options?.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {q.options.map((opt: string, i: number) => (
                                <div key={i} className={`p-2 rounded-lg text-sm border ${opt === q.correctAnswer ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]" : "bg-white/[0.02] border-white/[0.05] text-[#B6C2D9]"}`}>{opt}</div>
                              ))}
                            </div>
                          )}
                          {!q.options?.length && q.correctAnswer && (
                            <div className="mt-3 p-3 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-lg">
                              <span className="text-xs font-semibold text-[#22C55E] uppercase mb-1 block">Answer/Hint</span>
                              <p className="text-sm text-[#B6C2D9]">{q.correctAnswer}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 mt-4">
                          <textarea value={q.question} onChange={e => { const n = [...generatedQuestions]; n[idx].question = e.target.value; setGeneratedQuestions(n); }} className={`${inputClasses} min-h-[80px]`} />
                        </div>
                      )}
                    </GlassCard>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wizard State */}
        {step === "wizard" && (
          <GlassCard className="p-6 relative overflow-hidden min-h-[500px] flex flex-col">
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-8 relative z-10 overflow-x-auto pb-4 hide-scrollbar">
              {STEPS.map((stepName, idx) => {
                const s = idx + 1;
                return (
                  <div key={s} className="flex flex-col items-center gap-2 min-w-[80px] flex-1 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors z-10 ${currentStep === s ? "bg-[#5B5CFF] text-white shadow-[0_0_15px_rgba(91,92,255,0.4)]" : currentStep > s ? "bg-[#22C55E] text-white" : "bg-white/[0.06] text-[#7B8798]"}`}>
                      {currentStep > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap ${currentStep === s ? "text-[#5B5CFF]" : currentStep > s ? "text-[#22C55E]" : "text-[#7B8798]"}`}>
                      {stepName}
                    </span>
                    {s < STEPS.length && (
                      <div className="absolute top-4 left-1/2 w-[calc(100%-2rem)] h-[2px] bg-white/[0.06] -z-0">
                        <motion.div className="h-full bg-gradient-to-r from-[#22C55E] to-[#5B5CFF]" initial={{ width: 0 }} animate={{ width: currentStep > s ? "100%" : "0%" }} transition={{ duration: 0.3 }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <AnimatePresence custom={direction} mode="wait">
              <motion.div key={currentStep} custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="flex-1">
                
                {/* Step 1: Class Selection */}
                {currentStep === 1 && (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    <h2 className="text-xl font-bold text-white mb-6 text-center">Target Class Selection</h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                      {CLASSES.map(c => (
                        <button key={c} onClick={() => setSelectedClass(c)} className={`py-6 rounded-2xl border-2 transition-all text-center group ${selectedClass === c ? "border-[#4F9DFF] bg-[#4F9DFF]/10 shadow-[0_0_20px_rgba(79,157,255,0.15)]" : "border-white/[0.08] hover:border-white/[0.2] bg-white/[0.02]"}`}>
                          <span className={`text-xl font-black ${selectedClass === c ? "text-[#4F9DFF]" : "text-[#B6C2D9] group-hover:text-white"}`}>{c}</span>
                          <span className="block text-[10px] text-[#7B8798] uppercase tracking-wider mt-2 font-semibold">Class</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Curriculum / Subject */}
                {currentStep === 2 && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <h2 className="text-xl font-bold text-white text-center mb-6">Subject & Curriculum</h2>
                    
                    <div>
                      <label className={labelClasses}>1. Select Subject</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {getSubjectsForClass(selectedClass).map(s => (
                          <button key={s.id} onClick={() => { setSelectedSubjectId(s.id); setSelectedSubjectName(s.name); setTopic(""); }} className={`py-3 px-4 rounded-xl border-2 transition-all text-center ${selectedSubjectId === s.id ? "border-[#8B5CF6] bg-[#8B5CF6]/10" : "border-white/[0.08] hover:border-white/[0.2] bg-white/[0.02]"}`}>
                            <span className={`font-semibold text-sm ${selectedSubjectId === s.id ? "text-[#8B5CF6]" : "text-[#B6C2D9]"}`}>{s.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative mt-6">
                      <label className={labelClasses}>2. Topic</label>
                      <div className="relative">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#7B8798]" />
                        <input 
                          type="text" 
                          value={topic} 
                          onChange={e => setTopic(e.target.value)} 
                          placeholder="e.g. Linear Equations..." 
                          className={`${inputClasses} pl-12 py-3.5 text-base`} 
                        />
                        {topic && (
                          <button className="absolute right-4 top-3.5" onClick={() => setTopic("")}><X className="w-5 h-5 text-[#7B8798] hover:text-white" /></button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Homework Details & Setup */}
                {currentStep === 3 && (
                  <div className="space-y-5 max-w-3xl mx-auto">
                    <h2 className="text-xl font-bold text-white text-center mb-6">Homework Details & Deadlines</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="col-span-2">
                        <label className={labelClasses}>Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Linear Equations Practice" className={inputClasses} />
                      </div>
                      
                      <div>
                        <label className={labelClasses}>Homework Type</label>
                        <select value={type} onChange={e => setType(e.target.value)} className={inputClasses}>
                          {QUESTION_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className={labelClasses}>Difficulty Level</label>
                        <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={inputClasses}>
                          {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className={labelClasses}>Description / Instructions</label>
                        <RichTextEditor 
                          value={description} 
                          onChange={setDescription} 
                          placeholder="Add any special instructions for students..." 
                        />
                      </div>

                      <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] col-span-2 space-y-4">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-[#4F9DFF]" /> Deadlines & Timing</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClasses}>Due Date & Time</label>
                            <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className={`${inputClasses} [color-scheme:dark]`} />
                          </div>
                          <div>
                            <label className={labelClasses}>Estimated Time (Minutes)</label>
                            <select value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} className={inputClasses}>
                              {["10","20","30","45","60","90","120"].map(t => <option key={t}>{t} Mins</option>)}
                            </select>
                          </div>
                          
                          <div className="col-span-2 flex items-center justify-between pt-2 border-t border-white/[0.06]">
                            <div>
                              <p className="text-sm font-semibold text-white">Allow Late Submission</p>
                              <p className="text-xs text-[#7B8798]">Accept submissions after due date with penalty</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={allowLate} onChange={e => setAllowLate(e.target.checked)} />
                              <div className="w-11 h-6 bg-white/[0.1] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22C55E]"></div>
                            </label>
                          </div>
                          
                          {allowLate && (
                            <div className="col-span-2">
                              <label className={labelClasses}>Late Window</label>
                              <select value={lateWindow} onChange={e => setLateWindow(e.target.value)} className={inputClasses}>
                                <option value="1">1 Hour</option>
                                <option value="6">6 Hours</option>
                                <option value="12">12 Hours</option>
                                <option value="24">24 Hours</option>
                                <option value="48">48 Hours</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Intelligent Student Selection */}
                {currentStep === 4 && (
                  <div className="space-y-4 max-w-4xl mx-auto h-[400px] flex flex-col">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <h2 className="text-xl font-bold text-white">Select Students</h2>
                        <p className="text-sm text-[#7B8798]">Class {selectedClass} • {selectedStudentIds.length} of {allStudentsInClass.length} selected</p>
                      </div>
                      <div className="flex gap-2">
                        {["All", "Weak Students", "Top Performers"].map(f => (
                          <button key={f} onClick={() => setStudentFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${studentFilter === f ? "bg-[#5B5CFF] text-white" : "bg-white/[0.06] text-[#B6C2D9] hover:bg-white/[0.1]"}`}>
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#7B8798]" />
                      <input type="text" placeholder="Search by name or roll number..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className={`${inputClasses} pl-10 py-2.5`} />
                    </div>

                    <div className="flex-1 overflow-auto rounded-xl border border-white/[0.08] bg-white/[0.02]">
                      <table className="w-full text-left text-sm text-[#B6C2D9]">
                        <thead className="text-xs text-[#7B8798] uppercase bg-white/[0.04] sticky top-0 z-10">
                          <tr>
                            <th className="p-3 w-12 text-center">
                              <input type="checkbox" checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0} onChange={e => {
                                if(e.target.checked) setSelectedStudentIds(filteredStudents.map(s => s.id));
                                else setSelectedStudentIds([]);
                              }} className="rounded border-white/[0.2] bg-white/[0.05] text-[#5B5CFF]" />
                            </th>
                            <th className="p-3">Student Name</th>
                            <th className="p-3">HW Completion %</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map(s => (
                            <tr key={s.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                              <td className="p-3 text-center">
                                <input type="checkbox" checked={selectedStudentIds.includes(s.id)} onChange={e => {
                                  if (e.target.checked) setSelectedStudentIds(prev => [...prev, s.id]);
                                  else setSelectedStudentIds(prev => prev.filter(id => id !== s.id));
                                }} className="rounded border-white/[0.2] bg-white/[0.05] text-[#5B5CFF]" />
                              </td>
                              <td className="p-3 font-medium text-white flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5B5CFF]/20 to-[#8B5CF6]/20 flex items-center justify-center text-[#5B5CFF] font-bold">
                                  {s.name.charAt(0)}
                                </div>
                                {s.name}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-2 bg-white/[0.1] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#22C55E]" style={{width: `${Math.floor(Math.random() * 40 + 60)}%`}}></div>
                                  </div>
                                  <span className="text-xs text-[#7B8798]">{Math.floor(Math.random() * 40 + 60)}%</span>
                                </div>
                              </td>
                              <td className="p-3"><StatusBadge variant="success" dot>Active</StatusBadge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Step 5: AI Settings, Evaluation & Attachments */}
                {currentStep === 5 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <div className="space-y-5">
                      <h2 className="text-xl font-bold text-white mb-2">Evaluation & AI Setup</h2>
                      
                      <div>
                        <label className={labelClasses}>Evaluation Method</label>
                        <select value={evaluationMethod} onChange={e => setEvaluationMethod(e.target.value)} className={inputClasses}>
                          {EVAL_METHODS.map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>

                      <div className="p-4 rounded-xl border border-white/[0.08] bg-[#5B5CFF]/5 space-y-4">
                        <h3 className="text-sm font-semibold text-[#5B5CFF] flex items-center gap-2"><Brain className="w-4 h-4" /> AI Grading Engine Toggles</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(aiSettings).map(([key, value]) => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer group">
                              <input type="checkbox" checked={value} onChange={e => setAiSettings(p => ({...p, [key]: e.target.checked}))} className="rounded border-white/[0.2] bg-white/[0.05] text-[#5B5CFF] focus:ring-[#5B5CFF]/50" />
                              <span className="text-xs text-[#B6C2D9] group-hover:text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <h2 className="text-xl font-bold text-white mb-2">Attachments (Optional)</h2>
                      <div>
                        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => handleFileSelect(e.target.files)} />
                        
                        {attachments.length > 0 && (
                          <div className="flex flex-col gap-2 mb-4">
                            {attachments.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-[12px] bg-white/[0.04] border border-white/[0.08]">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  {getFileIcon(file.type)}
                                  <span className="text-sm text-white truncate">{file.name}</span>
                                </div>
                                <button onClick={() => removeAttachment(file.id)} className="p-1.5 hover:bg-white/[0.1] rounded-full text-[#7B8798] hover:text-[#EF4444] transition-colors"><X className="w-4 h-4" /></button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div onClick={() => fileInputRef.current?.click()} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`border-2 border-dashed rounded-[14px] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragging ? "border-[#5B5CFF] bg-[#5B5CFF]/10" : "border-white/[0.12] hover:bg-white/[0.04]"}`}>
                          <div className="p-3 bg-white/[0.04] rounded-full mb-3"><Upload className={`w-5 h-5 ${isDragging ? "text-[#5B5CFF]" : "text-[#7B8798]"}`} /></div>
                          <p className="text-sm text-white mb-1">Click to upload or drag and drop</p>
                          <p className="text-[11px] text-[#7B8798] uppercase tracking-wider font-medium">PDF, JPG, PPT up to 20MB</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {geminiError && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-start gap-3 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl max-w-3xl mx-auto w-full">
                  <AlertCircle className="w-4 h-4 text-[#EF4444] mt-0.5 shrink-0" />
                  <p className="text-sm text-[#EF4444]">{geminiError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.08] relative z-10">
              <GlassButton onClick={prevStep} className={currentStep === 1 ? "invisible" : ""}>Back</GlassButton>
              {currentStep < 5 ? (
                <GradientButton onClick={nextStep} className="px-8">Next Step <ChevronRight className="w-4 h-4 ml-1 inline" /></GradientButton>
              ) : (
                <GradientButton onClick={handleGenerate} className="px-8 flex items-center gap-2" loading={isPublishing}>
                  <Wand2 className="w-4 h-4" /> 
                  {type === "AI Generated Worksheet" || type === "MCQ" ? "Generate & Preview" : (isPublishing ? "Publishing..." : "Publish directly")}
                </GradientButton>
              )}
            </div>
          </GlassCard>
        )}
      </motion.div>
          {/* Royal Upload Status Modal for Teacher */}
      <AnimatePresence>
        {isPublishing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-[#1A2235] to-[#0D1525] border border-white/[0.08] p-8 rounded-[24px] shadow-[0_0_50px_rgba(91,92,255,0.2)] flex flex-col items-center text-center max-w-sm w-full"
            >
              <div className="mb-6 scale-150"><UploadProgressRing /></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}


