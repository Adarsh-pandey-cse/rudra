"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle, Users, BookOpen, Settings, Send } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { useHomeworkStore } from "@/store/homeworkStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import GlassButton from "@/components/ui/GlassButton";

import ClassSelector from "@/components/homework-v2/ClassSelector";
import StudentSelection from "@/components/homework-v2/StudentSelection";
import CurriculumSearch, { CurriculumTopic } from "@/components/homework-v2/CurriculumSearch";
import AssignmentDetails, { AssignmentDetailsState } from "@/components/homework-v2/AssignmentDetails";
import ReviewPublish from "@/components/homework-v2/ReviewPublish";
import type { Student, HomeworkDifficulty, EvaluationMethod } from "@/types";

const progressSteps = [
  { id: 1, title: "Target Audience", icon: Users },
  { id: 2, title: "Curriculum Match", icon: BookOpen },
  { id: 3, title: "Details & AI", icon: Settings },
  { id: 4, title: "Review & Publish", icon: Send },
];

export default function EditAssignmentWizardV2() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;
  
  const { currentUser, isAuthenticated, _hasHydrated, getAllUsers } = useAuthStore();
  const { updateAssignment, assignments } = useHomeworkStore();
  const [mounted, setMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // High-level Progress State (1 to 4)
  const [currentProgressStep, setCurrentProgressStep] = useState(1);
  
  // Granular V2 Flow State
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<CurriculumTopic | null>(null);

  const [detailsState, setDetailsState] = useState<AssignmentDetailsState>({
    title: "",
    description: "",
    type: "Practice Questions",
    difficulty: "Medium",
    estimatedTimeMin: 30,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    dueTime: "23:59",
    allowLate: false,
    lateWindowHours: 24,
    evaluationMethod: "Teacher + AI",
    aiSettings: {
      ocr: true,
      handwriting: true,
      conceptDetection: true,
      grammarCheck: false,
      diagramCheck: false,
      formulaCheck: false,
      similarityDetection: false,
      aiFeedback: true,
    }
  });

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      router.replace("/auth/login");
      return;
    }
    setMounted(true);
    
    // Load existing assignment data
    const teacherAssignments = assignments.filter(a => a.teacherId === currentUser.id);
    const master = teacherAssignments.find(a => a.id === assignmentId);
    
    if (master) {
      setSelectedClassId((master as any).targetClassId || (master as any).classId || null);
      setSelectedSubjectId(master.subjectId);
      
      if (master.topicId) {
        setSelectedTopic({
          id: master.topicId,
          title: master.title,
          chapter: "Loaded Chapter",
          subject: master.subjectId,
          unit: "Loaded Unit",
          board: "Custom",
          difficulty: "Medium",
          estimatedTime: 30,
          learningOutcomes: [(master as any).learningObjectives || ""],
          class: "10",
          book: "Loaded Book",
          subtopics: [],
          keywords: []
        });
      }

      // Find which students have this assignment
      const assignedStudentIds = useHomeworkStore.getState().submissions
        .filter((sub: any) => sub.assignmentId === assignmentId)
        .map((sub: any) => sub.studentId);
      setSelectedStudentIds(assignedStudentIds);
      
      const dateObj = new Date(master.dueDate);
      const ymd = dateObj.toISOString().split('T')[0];
      const hm = dateObj.toISOString().split('T')[1].substring(0, 5);

      setDetailsState({
        title: master.title,
        description: master.description || "",
        type: master.type as any,
        difficulty: master.difficulty as any,
        estimatedTimeMin: 30,
        dueDate: ymd,
        dueTime: hm,
        allowLate: master.allowLateSubmission,
        lateWindowHours: (master as any).lateSubmissionWindow || 24,
        evaluationMethod: (master as any).evaluationMethod as any,
        aiSettings: master.aiSettings || {
          ocr: true,
          handwriting: true,
          conceptDetection: true,
          grammarCheck: false,
          diagramCheck: false,
          formulaCheck: false,
          similarityDetection: false,
          aiFeedback: true,
        }
      });
      setIsLoaded(true);
    } else {
      router.push("/dashboard/teacher/homework");
    }
  }, [isAuthenticated, currentUser, router, assignmentId, _hasHydrated]);

  if (!mounted || !currentUser || !isLoaded) return null;

  const handleNext = () => {
    if (currentProgressStep < 4) setCurrentProgressStep(currentProgressStep + 1);
  };

  const handlePrev = () => {
    if (currentProgressStep > 1) setCurrentProgressStep(currentProgressStep - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentProgressStep !== 4) return;
    
    const dueDateStr = `${detailsState.dueDate}T${detailsState.dueTime}:00Z`;

    const updatePayload: any = {
      title: detailsState.title,
      description: detailsState.description,
      subjectId: selectedSubjectId || "math",
      type: detailsState.type,
      difficulty: detailsState.difficulty,
      learningObjectives: selectedTopic?.learningOutcomes?.join(", ") || "",
      dueDate: dueDateStr,
      allowLateSubmission: detailsState.allowLate,
      lateSubmissionWindow: detailsState.lateWindowHours,
      evaluationMethod: detailsState.evaluationMethod,
      aiSettings: detailsState.aiSettings,
      targetClassId: selectedClassId || undefined,
      topicId: selectedTopic?.id,
    };
    
    updateAssignment(assignmentId, updatePayload as any);
    
    // Note: We don't dynamically add/remove students here in the edit flow yet for simplicity, 
    // we just update the metadata of the master assignment and all existing copies.
    
    router.push("/dashboard/teacher/homework");
  };

  const isNextDisabled = () => {
    if (currentProgressStep === 1) {
      return !selectedClassId || selectedStudentIds.length === 0;
    }
    if (currentProgressStep === 2) {
      return !selectedSubjectId || !selectedTopic;
    }
    if (currentProgressStep === 3) {
      return !detailsState.title;
    }
    return false;
  };

  return (
    <DashboardLayout role="teacher">
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        
        {/* Header & Progress */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-6">Edit Assignment</h1>
          
          <div className="flex justify-between items-center relative max-w-3xl mx-auto mb-4 mt-6">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/[0.06] rounded-full z-0"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[#5B5CFF] to-[#4F9DFF] rounded-full z-0 transition-all duration-500"
              style={{ width: `${((currentProgressStep - 1) / (progressSteps.length - 1)) * 100}%` }}
            ></div>
            
            {progressSteps.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentProgressStep;
              const isPast = step.id < currentProgressStep;
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive ? "bg-[#131D2E] border-[#4F9DFF] text-[#4F9DFF] shadow-[0_0_15px_rgba(79,157,255,0.3)]" : 
                    isPast ? "bg-[#4F9DFF] border-[#4F9DFF] text-white" : 
                    "bg-[#131D2E] border-white/20 text-[#7B8798]"
                  }`}>
                    {isPast ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-[11px] font-semibold hidden sm:block uppercase tracking-wider ${isActive ? "text-[#4F9DFF]" : isPast ? "text-[#4F9DFF]" : "text-[#7B8798]"}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <GlassCard className="p-6 md:p-8 min-h-[500px] flex flex-col">
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                
                {/* PROGRESS STEP 1: Target Audience */}
                {currentProgressStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring" as const, ease: "easeOut" as const }}
                    className="space-y-10"
                  >
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-2">1. Target Class (Locked in Edit)</h2>
                      <p className="text-[#B6C2D9] mb-6 text-sm">You cannot change the target class of an existing assignment.</p>
                      <ClassSelector 
                        selectedClassId={selectedClassId} 
                        onSelect={() => {}} 
                      />
                    </div>
                    
                    {selectedClassId && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-lg font-semibold text-white mb-1">2. Assigned Students</h2>
                            <p className="text-[#B6C2D9] text-sm">View students who currently have this assignment.</p>
                          </div>
                        </div>
                        <StudentSelection 
                          classId={selectedClassId}
                          selectedStudentIds={selectedStudentIds}
                          onChange={setSelectedStudentIds}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* PROGRESS STEP 2: Curriculum Match */}
                {currentProgressStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring" as const, ease: "easeOut" as const }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-2">3. Match Curriculum</h2>
                      <p className="text-[#B6C2D9] mb-6 text-sm">Update the topic in the official curriculum engine if needed.</p>
                      <CurriculumSearch 
                        classId={selectedClassId!}
                        subjectId={selectedSubjectId}
                        onSubjectChange={setSelectedSubjectId}
                        onTopicSelect={setSelectedTopic}
                      />
                    </div>
                  </motion.div>
                )}

                {/* PROGRESS STEP 3: Details & AI */}
                {currentProgressStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring" as const, ease: "easeOut" as const }}
                  >
                    <AssignmentDetails 
                      state={detailsState} 
                      onChange={(updates) => setDetailsState(prev => ({ ...prev, ...updates }))} 
                      subjectId={selectedSubjectId}
                    />
                  </motion.div>
                )}

                {/* PROGRESS STEP 4: Review & Publish */}
                {currentProgressStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring" as const, ease: "easeOut" as const }}
                  >
                    <ReviewPublish
                      classId={selectedClassId}
                      studentIds={selectedStudentIds}
                      subjectId={selectedSubjectId}
                      topic={selectedTopic}
                      details={detailsState}
                    />
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Sticky Bottom Navigation */}
            <div className="flex justify-between mt-10 pt-6 border-t border-white/[0.08] shrink-0">
              <GlassButton type="button" onClick={currentProgressStep === 1 ? () => router.push("/dashboard/teacher/homework") : handlePrev}>
                {currentProgressStep === 1 ? "Cancel" : <><ArrowLeft className="w-4 h-4 mr-2" /> Back</>}
              </GlassButton>
              
              {currentProgressStep < 4 ? (
                <GradientButton type="button" onClick={handleNext} disabled={isNextDisabled()}>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </GradientButton>
              ) : (
                <GradientButton type="submit" variant="primary">
                  Save Changes <CheckCircle className="w-4 h-4 ml-2" />
                </GradientButton>
              )}
            </div>
          </form>
        </GlassCard>

      </div>
    </DashboardLayout>
  );
}
