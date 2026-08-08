import { create } from "zustand";
import { db } from "@/lib/firebase/firebase";
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, writeBatch } from "firebase/firestore";
import { uploadFile, base64ToFile } from "@/lib/firebase/uploadService";
import type { Assignment, Submission, GeneratedQuestion, AnswerKeyItem, AiEvaluation, QuestionGenConfig, TopicSearchResult, Attachment } from "@/types/homework-types";
import { CBSE_CURRICULUM } from "@/data/cbse-curriculum";
import { aiHomeworkService } from "@/lib/ai/aiHomeworkService";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { eventBus } from "@/lib/eventBus";
import { createAuditEntry, validateGrade, validateFeedback, AuditEntry, ReviewHistoryEntry } from "@/lib/homeworkLifecycle";
import { homeworkRepository } from "@/lib/repositories/homework.repository";
import { submissionRepository } from "@/lib/repositories/submission.repository";

// ─── Fuzzy search helper ───────────────────────────────────────
function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  const words = q.split(/\s+/);
  return words.every(w => t.includes(w));
}

// ─── Interface extending Submission if needed ──────────────────
// Assuming Submission is already updated in types, we just use it directly.
// But to be safe with TypeScript, we can cast when needed.

interface HomeworkState {
  assignments: Assignment[];
  submissions: (Submission & { 
    teacherId?: string; maxMarks?: number; evaluatedBy?: string; 
    reviewHistory?: ReviewHistoryEntry[]; auditLog?: AuditEntry[] 
  })[];
  isGenerating: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  initializeAssignmentsListener: () => () => void;
  initializeSubmissionsListener: (userId: string, role: string) => () => void;

  searchCurriculum: (query: string, classFilter?: string, subjectFilter?: string) => TopicSearchResult[];
  
  submitMCQAnswers: (assignmentId: string, studentId: string, answers: Record<string, string>) => Promise<void>;
  
  // Optimistic UI support
  addLocalAssignment: (assignment: Assignment) => void;
  createRemoteAssignment: (assignment: Assignment) => Promise<string>;
  
  createAssignment: (assignment: Omit<Assignment, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  purgeStudentSubmissions: (studentId: string) => void;
  publishAssignment: (id: string) => Promise<void>;
  
  generateQuestions: (config: QuestionGenConfig) => Promise<GeneratedQuestion[]>;
  regenerateQuestion: (type: GeneratedQuestion["type"], topicTitle: string) => Promise<GeneratedQuestion>;
  
  getTeacherAssignments: (teacherId: string) => Assignment[];
  getStudentAssignments: (studentId: string) => Assignment[];
  getAssignment: (id: string) => Assignment | undefined;
  getSubmission: (assignmentId: string, studentId: string) => any | undefined;
  getAssignmentSubmissions: (assignmentId: string) => any[];
  
  saveSubmissionDraft: (assignmentId: string, studentId: string, text: string, attachments: Attachment[]) => Promise<void>;
  submitHomework: (assignmentId: string, studentId: string) => Promise<void>;
  
  runAiEvaluation: (submissionId: string) => Promise<void>;
  teacherReview: (submissionId: string, grade: number | null, feedback: string, status?: "accepted" | "rejected" | "resubmission_requested") => Promise<void>;
  
  getTeacherHomeworkStats: (teacherId: string) => {
    totalAssignments: number;
    pendingGrading: number;
    aiEvaluated: number;
    avgScore: number;
  };
}

export const useHomeworkStore = create<HomeworkState>((set, get) => ({
      assignments: [],
      submissions: [],
      isGenerating: false,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      initializeAssignmentsListener: () => {
        const q = query(collection(db, "homeworks"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const assignments: Assignment[] = [];
          snapshot.forEach((doc) => assignments.push({ id: doc.id, ...doc.data() } as Assignment));
          console.log("[homeworkStore] initializeAssignmentsListener fetched", assignments.length, "assignments");
          
          set(state => {
            // Keep local optimistic assignments that haven't been published yet
            const localUploads = state.assignments.filter(a => (a.status as any) === "uploading" || (a.status as any) === "failed");
            
            // Merge keeping local status if conflicts
            const merged = [...localUploads];
            for (const remote of assignments) {
              if (!merged.find(a => a.id === remote.id)) {
                merged.push(remote);
              }
            }
            console.log("[homeworkStore] state updated with merged assignments:", merged.length);
            return { assignments: merged };
          });
        });
        return unsubscribe;
      },

      initializeSubmissionsListener: (userId, role) => {
        const q = query(collection(db, "homeworkSubmissions"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const submissions: any[] = [];
          snapshot.forEach((doc) => submissions.push({ id: doc.id, ...doc.data() }));
          set({ submissions });
        });
        return unsubscribe;
      },

      searchCurriculum: (query, classFilter, subjectFilter) => {
        if (!query || query.length < 2) return [];
        return CBSE_CURRICULUM
          .filter(topic => {
            if (classFilter && topic.class !== classFilter) return false;
            if (subjectFilter && topic.subject !== subjectFilter) return false;
            return fuzzyMatch(query, topic.title) || 
                   fuzzyMatch(query, topic.chapter) || 
                   (topic.unit && fuzzyMatch(query, topic.unit)) ||
                   topic.learningOutcomes.some(lo => fuzzyMatch(query, lo)) ||
                   topic.keywords.some(kw => fuzzyMatch(query, kw));
          })
          .map(topic => ({
            id: topic.id,
            title: topic.title,
            subject: topic.subject,
            chapter: topic.chapter,
            unit: topic.unit || "",
            board: topic.board,
            difficulty: topic.difficulty,
            estimatedTime: topic.estimatedTime,
            learningOutcomes: topic.learningOutcomes,
            topicName: topic.title,
            subjectName: topic.subject,
            chapterName: topic.chapter,
            class: topic.class,
          }))
          .slice(0, 10);
      },

      addLocalAssignment: (assignment) => {
        set(state => ({
          assignments: [assignment, ...state.assignments]
        }));
      },

      createRemoteAssignment: async (assignment) => {
        await homeworkRepository.create(assignment as any);
        set(state => ({
          assignments: state.assignments.map(a => a.id === assignment.id ? assignment : a)
        }));
        return assignment.id;
      },

      createAssignment: async (params) => {
        const id = `asgn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const now = new Date().toISOString();
        const extra: any = {
          teacherId: (params as any).assignedBy || "unknown",
          topicId: (params as any).topicId || "",
          topicTitle: (params as any).topicTitle || (params as any).title || "",
          instructions: (params as any).instructions || (params as any).description || "",
        };
        const newAssignment: any = {
          ...extra,
          ...params,
          id,
          createdAt: now,
          updatedAt: now,
        };
        
        await homeworkRepository.create(newAssignment as any);
        set(state => ({ assignments: [...state.assignments, newAssignment] }));
        return id;
      },

      updateAssignment: async (id, updates) => {
        const now = new Date().toISOString();
        const optimisticUpdates: any = {
          ...updates,
          updatedAt: now
        };
        await homeworkRepository.update(id, { ...updates, updatedAt: now } as any);
        set(state => ({
          assignments: state.assignments.map(a => a.id === id ? { ...a, ...updates, updatedAt: now } : a)
        }));
      },

      deleteAssignment: async (id) => {
        try {
          const batch = writeBatch(db);
          batch.delete(doc(db, "homeworks", id));
          
          const submissionsToDelete = get().submissions.filter(s => s.assignmentId === id);
          submissionsToDelete.forEach(sub => {
            batch.delete(doc(db, "homeworkSubmissions", sub.id));
          });
          
          await batch.commit();
          
          set(state => ({
            assignments: state.assignments.filter(a => a.id !== id),
            submissions: state.submissions.filter(s => s.assignmentId !== id)
          }));
        } catch (error) {
          console.error("Error deleting assignment and submissions:", error);
        }
      },

      purgeStudentSubmissions: async (studentId: string) => {
        try {
          const batch = writeBatch(db);
          const studentSubmissions = get().submissions.filter(s => s.studentId === studentId);
          studentSubmissions.forEach(sub => {
            batch.delete(doc(db, "submissions", sub.id));
          });
          await batch.commit();
          
          set(state => ({
            submissions: state.submissions.filter(s => s.studentId !== studentId)
          }));
        } catch (error) {
          console.error("Error purging student submissions:", error);
        }
      },

      publishAssignment: async (id) => {
        const now = new Date().toISOString();
        const assignment = get().assignments.find(a => a.id === id);
        let studentIds: string[] = [];
        
        if (assignment) {
          studentIds = assignment.recipientStudentIds || [];
          if (studentIds.length === 0 && assignment.classId) {
            const authState = useAuthStore.getState();
            const users = typeof authState.getAllUsers === 'function' ? authState.getAllUsers() : authState.users;
            const aClassNum = String(assignment.classId).replace(/\D/g, '');
            studentIds = users
              .filter(u => {
                if (u.role !== "student") return false;
                if ((u as any).status === "archived" || (u as any).status === "deleted") return false;
                const sClassNum = String((u as any).grade || (u as any).classId || "").replace(/\D/g, '');
                return (u as any).classId === assignment.classId || (aClassNum && aClassNum === sClassNum);
              })
              .map(u => u.id);
          }

          eventBus.emit({
            type: 'HOMEWORK_ASSIGNED',
            payload: {
              assignmentId: assignment.id,
              teacherId: assignment.teacherId,
              studentIds,
              title: assignment.title
            }
          });
        }
        
        await homeworkRepository.update(id, { 
          status: "published", 
          recipientStudentIds: studentIds,
          updatedAt: now 
        } as any);

        set(state => ({
          assignments: state.assignments.map(a => a.id === id ? { 
            ...a, 
            status: "published", 
            recipientStudentIds: studentIds,
            updatedAt: now 
          } : a)
        }));
      },

      generateQuestions: async (config) => {
        set({ isGenerating: true });
        try {
          const questions = await aiHomeworkService.generateQuestions(config);
          return questions;
        } finally {
          set({ isGenerating: false });
        }
      },

      regenerateQuestion: async (type, topicTitle) => {
        return aiHomeworkService.regenerateQuestion(type, topicTitle);
      },

      getTeacherAssignments: (teacherId) => {
        return get().assignments.sort((a, b) => {
          const tA = (a as any).createdAt?.seconds ? (a as any).createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
          const tB = (b as any).createdAt?.seconds ? (b as any).createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
      },

      getStudentAssignments: (studentId) => {
        const authState = useAuthStore.getState();
        const student = authState.users.find(u => u.id === studentId) || (authState.currentUser?.id === studentId ? authState.currentUser : null) as any;
        const classId = student?.classId || student?.grade || "";
        
        return get().assignments
          .filter(a => {
            if (a.status !== "published") return false;
            
            const isRecipient = a.recipientStudentIds?.includes(studentId);
            if (isRecipient) return true;
            
            if (!a.recipientStudentIds || a.recipientStudentIds.length === 0) {
              const aClassNum = String(a.classId || "").replace(/\D/g, '');
              const sClassNum = String(student?.grade || classId).replace(/\D/g, '');
              return !a.classId || a.classId === classId || aClassNum === sClassNum;
            }
            
            return false;
          })
          .sort((a, b) => {
            const tA = (a as any).createdAt?.seconds ? (a as any).createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
            const tB = (b as any).createdAt?.seconds ? (b as any).createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
            return tB - tA;
          });
      },

      getAssignment: (id) => get().assignments.find(a => a.id === id),
      
      getSubmission: (assignmentId, studentId) => {
        return get().submissions.find(s => s.assignmentId === assignmentId && s.studentId === studentId);
      },

      getAssignmentSubmissions: (assignmentId) => {
        return get().submissions.filter(s => s.assignmentId === assignmentId).sort((a, b) => {
          const tA = (a.createdAt as any)?.seconds ? (a.createdAt as any).seconds * 1000 : new Date(a.createdAt || 0).getTime();
          const tB = (b.createdAt as any)?.seconds ? (b.createdAt as any).seconds * 1000 : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
      },

      saveSubmissionDraft: async (assignmentId, studentId, text, attachments) => {
        const now = new Date().toISOString();
        const existing = get().submissions.find(s => s.assignmentId === assignmentId && s.studentId === studentId);
        const assignment = get().assignments.find(a => a.id === assignmentId);

        if (existing) {
          const updatedSub = { 
            ...existing, 
            textResponse: text, 
            attachments, 
            updatedAt: now 
          };
          await submissionRepository.update(existing.id, updatedSub as any);
          set(state => ({ submissions: state.submissions.map(s => s.id === existing.id ? updatedSub : s) }));
        } else {
          const subId = `sub_${Date.now()}`;
          const newSub: any = {
            id: subId,
            assignmentId,
            studentId,
            teacherId: assignment?.teacherId || "",
            maxMarks: assignment?.maxMarks || 0,
            evaluatedBy: "",
            reviewHistory: [],
            auditLog: [createAuditEntry("DRAFT_CREATED", studentId, "not_started", "draft")],
            textResponse: text,
            attachments,
            currentVersion: 1,
            versions: [],
            status: "draft",
            submittedAt: null,
            isLate: false,
            aiEvaluation: null,
            teacherGrade: null,
            teacherFeedback: "",
            teacherReviewedAt: null,
            createdAt: now,
            updatedAt: now,
          };
          await submissionRepository.create(newSub as any);
          set(state => ({ submissions: [...state.submissions, newSub] }));
        }
      },

      submitHomework: async (assignmentId, studentId) => {
        const now = new Date();
        const nowIso = now.toISOString();
        const existing = get().submissions.find(s => s.assignmentId === assignmentId && s.studentId === studentId);
        const assignment = get().assignments.find(a => a.id === assignmentId);
        const isLate = assignment ? now > new Date(assignment.dueDate) : false;

        if (existing) {
            let updatedVersions = existing.versions || [];
            let currentVersion = existing.currentVersion || 1;
            
            if (existing.status === "rejected" || existing.status === "resubmission_requested") {
              const snapshot = {
                id: `ver_${Date.now()}`,
                versionNumber: currentVersion,
                submittedAt: existing.submittedAt || nowIso,
                textResponse: existing.textResponse,
                attachments: [...existing.attachments],
                aiEvaluation: existing.aiEvaluation,
                teacherGrade: existing.teacherGrade,
                teacherFeedback: existing.teacherFeedback,
                status: existing.status
              };
              updatedVersions = [snapshot, ...updatedVersions].slice(0, 5);
              currentVersion += 1;
            }
            
            const newStatus = (existing.status === "rejected" || existing.status === "resubmission_requested") 
              ? "resubmitted" 
              : "submitted";

            const newAuditLog = [...(existing.auditLog || []), createAuditEntry("SUBMIT", studentId, existing.status, newStatus)];
            const updatedSub: any = { 
                ...existing, 
                status: newStatus, 
                submittedAt: nowIso, 
                isLate, 
                updatedAt: nowIso,
                currentVersion,
                versions: updatedVersions,
                aiEvaluation: null, 
                teacherGrade: null,
                teacherFeedback: "",
                teacherReviewedAt: null,
                auditLog: newAuditLog
            };

            await submissionRepository.update(existing.id, updatedSub as any);
            
            setTimeout(() => {
              eventBus.emit({
                type: 'HOMEWORK_SUBMITTED',
                payload: {
                  assignmentId,
                  studentId: studentId!,
                  submissionId: existing.id,
                  version: currentVersion,
                  isLate
                } as any
              });
            }, 0);
            
            set(state => ({ submissions: state.submissions.map(s => s.id === existing.id ? updatedSub : s) }));
        } else {
            const subId = `sub_${Date.now()}`;
            const newAuditLog = [createAuditEntry("SUBMIT", studentId, "not_started", "submitted")];
            
            const newSub: any = {
              id: subId,
              assignmentId,
              studentId,
              teacherId: assignment?.teacherId || "",
              maxMarks: assignment?.maxMarks || 0,
              evaluatedBy: "",
              reviewHistory: [],
              auditLog: newAuditLog,
              textResponse: "",
              attachments: [],
              currentVersion: 1,
              versions: [],
              status: "submitted",
              submittedAt: nowIso,
              isLate,
              aiEvaluation: null,
              teacherGrade: null,
              teacherFeedback: "",
              teacherReviewedAt: null,
              createdAt: nowIso,
              updatedAt: nowIso,
            };

            await submissionRepository.create(newSub as any);
            
            setTimeout(() => {
              eventBus.emit({
                type: 'HOMEWORK_SUBMITTED',
                payload: {
                  assignmentId,
                  studentId,
                  submissionId: subId,
                  version: 1,
                  isLate
                } as any
              });
            }, 0);
            
            // Get student details for notification
            const authState = useAuthStore.getState();
            const student = (authState.getAllUsers ? authState.getAllUsers() : authState.users).find(u => u.id === studentId);
            const studentName = student?.name || "A student";
            const className = (student as any)?.classId || (student as any)?.grade || "";

            if (assignment) {
              useNotificationStore.getState().addNotification({
                recipientId: assignment.teacherId,
                title: "Homework Submitted",
                message: `${studentName}${className ? ` from Class ${className}` : ''} has submitted "${assignment.title}".`,
                link: `/dashboard/teacher/homework/analytics/${assignmentId}`
              });
            }

            set(state => ({ submissions: [...state.submissions, newSub] }));
        }
      },

      submitMCQAnswers: async (assignmentId, studentId, answers) => {
        const now = new Date();
        const nowIso = now.toISOString();
        const { assignments, submissions } = get();
        const assignment = assignments.find(a => a.id === assignmentId);
        
        if (!assignment) return;
        
        const isLate = now > new Date(assignment.dueDate);
        
        let score = 0;
        const questionResults: any[] = [];
        
        assignment.questions.forEach(q => {
          const studentAns = answers[q.id] || "";
          const isCorrect = studentAns === q.correctAnswer;
          const marksAwarded = isCorrect ? q.marks : 0;
          score += marksAwarded;
          
          questionResults.push({
            questionId: q.id,
            studentAnswer: studentAns,
            isCorrect,
            marksAwarded,
            marksTotal: q.marks,
            feedback: isCorrect ? "Correct" : `Incorrect. The correct answer is ${q.correctAnswer}`
          });
        });

        const percentage = Math.round((score / assignment.maxMarks) * 100);
        const evaluationResult = {
          suggestedMarks: score,
          maxMarks: assignment.maxMarks,
          percentage,
          overallFeedback: `You scored ${score} out of ${assignment.maxMarks}.`,
          studentFeedback: `Good job completing the quiz!`,
          weakTopics: [],
          strongTopics: [],
          conceptMastery: {},
          questionResults,
          evaluatedAt: nowIso
        };

        const existing = submissions.find(s => s.assignmentId === assignmentId && s.studentId === studentId);
        
        let updatedSubmissions = submissions;
        
        if (existing) {
          const newAuditLog = [...(existing.auditLog || []), createAuditEntry("AUTO_EVALUATE", "system", existing.status, "ai_evaluated")];
          
          const updatedSub: any = { 
            ...existing, 
            status: "ai_evaluated", 
            submittedAt: nowIso, 
            isLate, 
            aiEvaluation: evaluationResult, 
            teacherGrade: score, 
            updatedAt: nowIso, 
            auditLog: newAuditLog 
          };
          
          await submissionRepository.update(existing.id, updatedSub as any);
          updatedSubmissions = submissions.map(s => s.id === existing.id ? updatedSub : s);
          
          setTimeout(() => {
            eventBus.emit({
              type: 'HOMEWORK_GRADED',
              payload: {
                submissionId: existing.id,
                assignmentId,
                studentId,
                teacherId: 'system',
                grade: score,
                maxMarks: assignment.maxMarks,
                feedback: "Auto-evaluated MCQ",
                title: assignment.title
              }
            });
            eventBus.emit({
              type: 'HOMEWORK_SUBMITTED',
              payload: { assignmentId, studentId, submissionId: existing.id, version: (existing.currentVersion || 0) + 1, isLate } as any
            });
          }, 0);
        } else {
          const subId = `sub_${Date.now()}`;
          const newAuditLog = [createAuditEntry("AUTO_EVALUATE", "system", "not_started", "ai_evaluated")];
          
          const newSub: any = {
            id: subId,
            assignmentId,
            studentId,
            teacherId: assignment.teacherId,
            maxMarks: assignment.maxMarks,
            evaluatedBy: "system",
            reviewHistory: [],
            auditLog: newAuditLog,
            textResponse: JSON.stringify(answers),
            attachments: [],
            currentVersion: 1,
            versions: [],
            status: "ai_evaluated",
            submittedAt: nowIso,
            isLate,
            aiEvaluation: evaluationResult,
            teacherGrade: score,
            teacherFeedback: "Auto-evaluated MCQ",
            teacherReviewedAt: nowIso,
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          
          await submissionRepository.create(newSub as any);
          updatedSubmissions = [...submissions, newSub];

          setTimeout(() => {
            eventBus.emit({
              type: 'HOMEWORK_GRADED',
              payload: {
                submissionId: subId,
                assignmentId,
                studentId,
                teacherId: 'system',
                grade: score,
                maxMarks: assignment.maxMarks,
                feedback: "Auto-evaluated MCQ",
                title: assignment.title
              }
            });
            eventBus.emit({
              type: 'HOMEWORK_SUBMITTED',
              payload: { assignmentId, studentId, submissionId: subId, version: 1, isLate } as any
            });
          }, 0);
        }
        
        set({ submissions: updatedSubmissions });
      },

      runAiEvaluation: async (submissionId) => {
        const preSub = get().submissions.find(s => s.id === submissionId);
        if (preSub) {
          const preAudit = [...(preSub.auditLog || []), createAuditEntry("AI_EVAL_START", "system", preSub.status, "ai_evaluating")];
          await submissionRepository.update(submissionId, { status: "ai_evaluating", auditLog: preAudit } as any);
          set(state => ({
            submissions: state.submissions.map(s => s.id === submissionId ? { ...s, status: "ai_evaluating", auditLog: preAudit } : s)
          }));
        }

        const { submissions, assignments } = get();
        const sub = submissions.find(s => s.id === submissionId);
        if (!sub) return;
        
        const assignment = assignments.find(a => a.id === sub.assignmentId);
        if (!assignment) return;

        const evaluation = await aiHomeworkService.evaluateSubmission(assignment.maxMarks, assignment.questions);
        const now = new Date().toISOString();

        const postAudit = [...(sub.auditLog || []), createAuditEntry("AI_EVAL_COMPLETE", "system", sub.status, "ai_evaluated")];
        await submissionRepository.update(submissionId, { aiEvaluation: evaluation, status: "ai_evaluated", updatedAt: now, auditLog: postAudit } as any);

        set(state => ({
          submissions: state.submissions.map(s => s.id === submissionId ? { 
            ...s, 
            aiEvaluation: evaluation, 
            status: "ai_evaluated", 
            updatedAt: now,
            auditLog: postAudit
          } : s)
        }));
      },

      teacherReview: async (submissionId, grade, feedback, status = "accepted") => {
        const now = new Date().toISOString();
        const currentState = get();
        const sub = currentState.submissions.find(s => s.id === submissionId);
        
        if (!sub) return;
        
        const assignment = currentState.assignments.find(a => a.id === sub.assignmentId);
        const currentTeacherId = useAuthStore.getState().currentUser?.id || "unknown";

        if (status === "accepted") {
          const gVal = validateGrade(grade || 0, sub.maxMarks || (assignment?.maxMarks || 0));
          if (!gVal.valid) throw new Error(gVal.error);
        }
        
        const fVal = validateFeedback(feedback, status);
        if (!fVal.valid) throw new Error(fVal.error);
        
        const newReviewEntry: ReviewHistoryEntry = {
           id: `rev_${Date.now()}`,
           version: sub.currentVersion || 1,
           status,
           marks: grade,
           maxMarks: sub.maxMarks || (assignment?.maxMarks || 0),
           feedback,
           reviewedBy: currentTeacherId,
           reviewedAt: now
        };

        const newAudit = createAuditEntry("TEACHER_REVIEW", currentTeacherId, sub.status, status, { grade, feedback });
        const updatedSub = { 
            ...sub, 
            teacherGrade: grade,
            teacherFeedback: feedback,
            status,
            teacherReviewedAt: now,
            updatedAt: now,
            reviewHistory: [...(sub.reviewHistory || []), newReviewEntry],
            auditLog: [...(sub.auditLog || []), newAudit]
        };

        await submissionRepository.update(submissionId, updatedSub);

        set(state => ({
          submissions: state.submissions.map(s => s.id === submissionId ? updatedSub : s)
        }));

        const title = assignment?.title || "Homework";

        if (status === "accepted") {
          setTimeout(() => {
            eventBus.emit({
               type: 'HOMEWORK_GRADED',
               payload: {
                 submissionId,
                 assignmentId: sub.assignmentId,
                 studentId: sub.studentId,
                 teacherId: currentTeacherId,
                 grade: grade || 0,
                 maxMarks: sub.maxMarks || (assignment?.maxMarks || 0),
                 feedback,
                 title
               }
            });
          }, 0);
        } else if (status === "rejected") {
          setTimeout(() => {
            eventBus.emit({
               type: 'HOMEWORK_REJECTED',
               payload: {
                 submissionId,
                 assignmentId: sub.assignmentId,
                 studentId: sub.studentId,
                 teacherId: currentTeacherId,
                 reason: feedback,
                 title
               }
            });
          }, 0);
        } else if (status === "resubmission_requested") {
          setTimeout(() => {
            eventBus.emit({
               type: 'HOMEWORK_RESUBMISSION_REQUESTED',
               payload: {
                 submissionId,
                 assignmentId: sub.assignmentId,
                 studentId: sub.studentId,
                 teacherId: currentTeacherId,
                 remarks: feedback,
                 title
               }
            });
          }, 0);
        }
      },

      getTeacherHomeworkStats: (teacherId) => {
        const { assignments, submissions } = get();
        const teacherAssignments = assignments;
        const teacherSubmissions = submissions.filter(s =>
          teacherAssignments.some(a => a.id === s.assignmentId)
        );

        const pending = teacherSubmissions.filter(s => s.status === "submitted").length;
        const aiEvaluated = teacherSubmissions.filter(s => s.status === "ai_evaluated").length;
        const reviewed = teacherSubmissions.filter(s => s.status === "teacher_reviewed" || s.status === "accepted" || s.status === "rejected" || s.status === "resubmission_requested");
        const avgScore = reviewed.length > 0
          ? Math.round(
              reviewed.reduce((sum, s) => {
                const assignment = teacherAssignments.find(a => a.id === s.assignmentId);
                const max = (assignment as any)?.maxMarks || 20;
                let pct = 0;
                if (s.teacherGrade !== null && s.teacherGrade !== undefined) {
                  pct = (s.teacherGrade / max) * 100;
                } else if (s.aiEvaluation?.percentage !== undefined) {
                  pct = s.aiEvaluation.percentage;
                }
                return sum + pct;
              }, 0) / reviewed.length
            )
          : 0;

        return {
          totalAssignments: teacherAssignments.length,
          pendingGrading: pending + aiEvaluated,
          aiEvaluated,
          avgScore,
        };
      },
}));
