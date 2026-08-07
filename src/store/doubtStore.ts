import { create } from "zustand";
import type { Doubt, DoubtReply, DoubtStats, DoubtStatus, DoubtPriority, KnowledgeBaseEntry } from "@/types/doubt-types";
import type { Attachment } from "@/types/homework-types";
import { useNotificationStore } from "./notificationStore";
import { db } from "@/lib/firebase/firebase";
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  onSnapshot, query, where, orderBy 
} from "firebase/firestore";
import { uploadFile, base64ToFile } from "@/lib/firebase/uploadService";
import { doubtRepository } from "@/lib/repositories/doubt.repository";

interface DoubtState {
  doubts: Doubt[];
  replies: DoubtReply[];
  knowledgeBase: KnowledgeBaseEntry[];
  typingStatus: Record<string, string | null>; // doubtId -> role
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  setTyping: (doubtId: string, role: string | null) => void;

  initializeDoubtsListener: (userId?: string, role?: string) => () => void;
  initializeRepliesListener: (doubtId: string) => () => void;

  askDoubt: (params: {
    studentId: string;
    studentName: string;
    subjectId: string;
    subjectName: string;
    topicId?: string;
    topicName?: string;
    classId?: string;
    question: string;
    attachments: Attachment[];
  }) => Promise<string>;
  
  addLocalDoubt: (doubt: Doubt) => void;
  createRemoteDoubt: (doubt: Doubt) => Promise<string>;
  
  requestAiAnswer: (doubtId: string) => Promise<void>;
  requestAiFollowUp: (doubtId: string, studentMessage: string) => Promise<void>;
  escalateToTeacher: (doubtId: string) => Promise<void>;
  markResolved: (doubtId: string) => Promise<void>;
  reopenDoubt: (doubtId: string) => Promise<void>;
  rateResponse: (doubtId: string, rating: number, feedback?: string) => Promise<void>;

  teacherReply: (doubtId: string, teacherId: string, teacherName: string, content: string, attachments: Attachment[]) => Promise<void>;
  updateDoubtStatus: (doubtId: string, status: DoubtStatus) => Promise<void>;
  purgeStudentDoubts: (studentId: string) => void;
  resolveDoubt: (doubtId: string, teacherId: string) => Promise<void>;
  studentReply: (doubtId: string, studentId: string, studentName: string, content: string, attachments: Attachment[]) => Promise<void>;

  getStudentDoubts: (studentId: string) => Doubt[];
  getTeacherPendingDoubts: () => Doubt[];
  getTeacherAllDoubts: () => Doubt[];
  getDoubt: (id: string) => Doubt | undefined;
  getDoubtReplies: (doubtId: string) => DoubtReply[];
  getDoubtStats: () => DoubtStats;
}

export const useDoubtStore = create<DoubtState>((set, get) => ({
      doubts: [],
      replies: [],
      knowledgeBase: [],
      typingStatus: {},
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setTyping: (doubtId, role) => {
        set(state => ({
          typingStatus: { ...state.typingStatus, [doubtId]: role }
        }));
      },

      initializeDoubtsListener: (userId, role) => {
        const q = query(collection(db, "doubts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const doubts: Doubt[] = [];
          snapshot.forEach((doc) => {
            doubts.push({ id: doc.id, ...doc.data() } as Doubt);
          });
          set(state => {
            const localUploads = state.doubts.filter(d => (d.status as any) === "pending" || (d.status as any) === "failed");
            
            const merged = [...doubts];
            for (const local of localUploads) {
              if (!merged.find(d => d.id === local.id)) {
                merged.push(local);
              }
            }
            return { doubts: merged };
          });
        });
        return unsubscribe;
      },

      initializeRepliesListener: (doubtId) => {
        const q = query(collection(db, `doubts/${doubtId}/replies`), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const newReplies: DoubtReply[] = [];
          snapshot.forEach((doc) => {
            newReplies.push({ id: doc.id, ...doc.data() } as DoubtReply);
          });
          
          set(state => {
            const otherReplies = state.replies.filter(r => r.doubtId !== doubtId);
            return { replies: [...otherReplies, ...newReplies] };
          });
        });
        return unsubscribe;
      },

      addLocalDoubt: (doubt: Doubt) => {
        set(state => ({
          doubts: [doubt, ...state.doubts]
        }));
      },

      createRemoteDoubt: async (doubt: Doubt) => {
        await doubtRepository.create(doubt);
        set(state => ({
          doubts: state.doubts.map(d => d.id === doubt.id ? doubt : d)
        }));
        
        const { addNotification } = useNotificationStore.getState();
        addNotification({
          recipientId: 'all_teachers',
          title: 'New Doubt',
          message: `${doubt.studentName} has asked a doubt in ${doubt.subjectName}`,
          link: `/dashboard/teacher/doubts/${doubt.id}`
        });
        
        return doubt.id;
      },

      askDoubt: async (params) => {
        const id = `doubt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const now = new Date().toISOString();
        
        const newDoubt: Doubt = {
          id,
          ...params,
          status: "pending" as any,
          priority: "normal" as any,
          isAiAnswered: false,
          hasTeacherFollowUp: false,
          resolutionStatus: "unresolved",
          createdAt: now,
          updatedAt: now,
        } as any;

        await doubtRepository.create(newDoubt);
        set(state => ({ doubts: [newDoubt, ...state.doubts] }));
        
        const { addNotification } = useNotificationStore.getState();
        addNotification({
          recipientId: 'all_teachers',
          title: 'New Doubt',
          message: `${params.studentName} has asked a doubt in ${params.subjectName}`,
          link: `/dashboard/teacher/doubts/${id}`
        });

        return id;
      },

      requestAiAnswer: async (doubtId) => {
        const doubt = get().doubts.find(d => d.id === doubtId);
        if (!doubt) return;

        // const response = await aiDoubtService.answerDoubt(doubt.question, doubt.subjectId, doubt.topicName);
        const now = new Date().toISOString();

        const replyId = `reply_${Date.now()}`;
        const aiReply: DoubtReply = {
          id: replyId,
          doubtId,
          authorId: "ai",
          authorName: "Rudra AI",
          authorRole: "ai",
          content: "AI is disabled",
          attachments: [],
          createdAt: now,
        };

        set(state => ({
          replies: [...state.replies, aiReply],
          doubts: state.doubts.map(d => d.id === doubtId ? { ...d, aiResponse: "AI disabled", status: "ai_answered", updatedAt: now } : d)
        }));
      },

      requestAiFollowUp: async (doubtId, studentMessage) => {
        const doubt = get().doubts.find(d => d.id === doubtId);
        if (!doubt) return;

        // const response = await aiDoubtService.answerFollowUp(studentMessage, doubt.aiResponse || "");
        const now = new Date().toISOString();

        const replyId = `reply_${Date.now()}`;
        const aiReply: DoubtReply = {
          id: replyId,
          doubtId,
          authorId: "ai",
          authorName: "Rudra AI",
          authorRole: "ai",
          content: "AI is disabled",
          attachments: [],
          createdAt: now,
        };

        set(state => ({
          replies: [...state.replies, aiReply],
          doubts: state.doubts.map(d => d.id === doubtId ? { ...d, status: "ai_answered", updatedAt: now } : d)
        }));
      },

      escalateToTeacher: async (doubtId) => {
        const now = new Date().toISOString();
        set(state => ({
          doubts: state.doubts.map(d => d.id === doubtId ? { ...d, needsTeacher: true, status: "escalated", priority: "high", updatedAt: now } : d)
        }));
      },

      markResolved: async (doubtId) => {
        const now = new Date().toISOString();
        const doubt = get().doubts.find(d => d.id === doubtId);
        if (!doubt) return;

        // Try to figure out resolvedBy if not already set (last teacher reply)
        let resolvedBy = doubt.resolvedBy;
        if (!resolvedBy) {
          const replies = get().replies.filter(r => r.doubtId === doubtId && r.authorRole === 'teacher');
          if (replies.length > 0) {
            resolvedBy = replies[replies.length - 1].authorId;
          }
        }

        await doubtRepository.update(doubtId, { status: "resolved", resolvedAt: now, updatedAt: now, resolvedBy });

        set(state => ({
          doubts: state.doubts.map(d => d.id === doubtId ? { ...d, status: "resolved", resolvedAt: now, updatedAt: now, resolvedBy } : d)
        }));
      },

      reopenDoubt: async (doubtId) => {
        const now = new Date().toISOString();
        await doubtRepository.update(doubtId, { status: "reopened", resolvedAt: null, updatedAt: now });
        set(state => ({
          doubts: state.doubts.map(d => d.id === doubtId ? { ...d, status: "reopened", resolvedAt: null, updatedAt: now } : d)
        }));
      },

      rateResponse: async (doubtId, rating, feedback) => {
        const now = new Date().toISOString();
        await doubtRepository.update(doubtId, { studentRating: rating, studentFeedback: feedback, updatedAt: now });
        set(state => ({
          doubts: state.doubts.map(d => d.id === doubtId ? { ...d, studentRating: rating, studentFeedback: feedback, updatedAt: now } : d)
        }));
      },

      teacherReply: async (doubtId, teacherId, teacherName, content, attachments) => {
        const now = new Date().toISOString();
        const replyId = `reply_${Date.now()}`;
        const reply: DoubtReply = {
          id: replyId,
          doubtId,
          authorId: teacherId,
          authorName: teacherName,
          authorRole: "teacher",
          content,
          attachments,
          createdAt: now,
        };

        const doubt = get().doubts.find(d => d.id === doubtId);

        // Optimistic UI update first!
        set(state => ({
          replies: [...state.replies, reply],
          doubts: state.doubts.map(d => d.id === doubtId ? { ...d, status: "teacher_answered", updatedAt: now } : d)
        }));

        await doubtRepository.createReply(doubtId, reply);
        await doubtRepository.update(doubtId, { status: "teacher_answered", updatedAt: now });

        if (doubt) {
          const { addNotification } = useNotificationStore.getState();
          addNotification({
            recipientId: doubt.studentId,
            title: 'Teacher Replied',
            message: `${teacherName} replied to your doubt. Tap to view.`,
            link: `/dashboard/student/doubts/${doubtId}`
          });
        }
      },
      
      updateDoubtStatus: async (doubtId, status) => {
        const now = new Date().toISOString();
        await doubtRepository.update(doubtId, { status, updatedAt: now });
        set(state => ({
          doubts: state.doubts.map(d => d.id === doubtId ? { ...d, status, updatedAt: now } : d)
        }));
      },

      resolveDoubt: async (doubtId, teacherId) => {
        const doubt = get().doubts.find(d => d.id === doubtId);
        if (!doubt) return;

        const now = new Date().toISOString();
        
        const replies = get().replies.filter(r => r.doubtId === doubtId);
        const bestAnswer = replies.find(r => r.authorRole === "teacher")?.content || doubt.aiResponse || "";

        const kbId = `kb_${Date.now()}`;
        const kbEntry: KnowledgeBaseEntry = {
          doubtId,
          question: doubt.question,
          answer: bestAnswer,
          subjectId: doubt.subjectId,
          topicId: doubt.topicId || "general",
          tags: [doubt.subjectName],
          useCount: 0,
          createdAt: now,
        };

        await doubtRepository.update(doubtId, { status: "resolved", resolvedAt: now, updatedAt: now, resolvedBy: teacherId });

        set(state => ({
          knowledgeBase: [...state.knowledgeBase, kbEntry],
          doubts: state.doubts.map(d => d.id === doubtId ? { ...d, status: "resolved", resolvedAt: now, updatedAt: now, resolvedBy: teacherId } : d)
        }));

        const { addNotification } = useNotificationStore.getState();
        addNotification({
          recipientId: doubt.studentId,
          title: 'Doubt Resolved',
          message: 'Your doubt has been resolved! Tap to view.',
          link: `/dashboard/student/doubts/${doubtId}`
        });
      },

      purgeStudentDoubts: async (studentId: string) => {
        try {
          const doubtsToDelete = get().doubts.filter(d => d.studentId === studentId && !d.studentRating && !d.studentFeedback);
          
          set(state => ({
            doubts: state.doubts.filter(d => !(d.studentId === studentId && !d.studentRating && !d.studentFeedback))
          }));
          
          for (const d of doubtsToDelete) {
             await doubtRepository.delete(d.id);
          }
        } catch (error) {
          console.error("Error purging doubts:", error);
        }
      },

      studentReply: async (doubtId, studentId, studentName, content, attachments) => {
        const now = new Date().toISOString();
        const replyId = `reply_${Date.now()}`;
        const reply: DoubtReply = {
          id: replyId,
          doubtId,
          authorId: studentId,
          authorName: studentName,
          authorRole: "student",
          content,
          attachments,
          createdAt: now,
        };

        const doubt = get().doubts.find(d => d.id === doubtId);

        // Optimistic UI update first!
        set(state => ({
          replies: [...state.replies, reply],
          doubts: state.doubts.map(d => d.id === doubtId ? { ...d, status: "open", updatedAt: now } : d)
        }));

        await doubtRepository.createReply(doubtId, reply);
        await doubtRepository.update(doubtId, { status: "open", updatedAt: now });

        if (doubt) {
          const { addNotification } = useNotificationStore.getState();
          addNotification({
            recipientId: 'all_teachers',
            title: 'Student Follow-up',
            message: `${studentName} asked a follow-up in ${doubt.subjectName}`,
            link: `/dashboard/teacher/doubts/${doubtId}`
          });
        }
      },

      getStudentDoubts: (studentId) => {
        return get().doubts
          .filter(d => d.studentId === studentId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getTeacherPendingDoubts: () => {
        return get().doubts
          .filter(d => d.status === "escalated" || d.status === "open" || d.status === "reopened")
          .sort((a, b) => {
            const weight = { urgent: 3, high: 2, medium: 1, low: 0 };
            const prioDiff = (weight[b.priority] || 0) - (weight[a.priority] || 0);
            if (prioDiff !== 0) return prioDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
      },

      getTeacherAllDoubts: () => {
        return get().doubts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getDoubt: (id) => get().doubts.find(d => d.id === id),

      getDoubtReplies: (doubtId) => {
        return get().replies
          .filter(r => r.doubtId === doubtId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      },

      getDoubtStats: () => {
        const { doubts } = get();
        const pending = doubts.filter(d => d.status === "open").length;
        const resolvedToday = doubts.filter(d => {
          if (d.status !== "resolved") return false;
          // Just mock 'today' logic roughly
          const dDate = new Date(d.createdAt).toDateString();
          const today = new Date().toDateString();
          return dDate === today;
        }).length;
        
        // Mocking topSubjects
        const topSubjects = [
          { subjectId: "sci_01", subjectName: "Science", count: 12 },
          { subjectId: "math_01", subjectName: "Math", count: 8 }
        ];
        
        return {
          totalDoubts: doubts.length,
          pendingDoubts: pending,
          resolvedToday: resolvedToday,
          avgResponseTime: "15 min",
          topSubjects
        };
      },
}));
