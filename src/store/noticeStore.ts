import { create } from "zustand";
import type { Notice, NoticeRead, NoticeAnalytics, NoticeType, NoticePriority, NoticeTarget, NoticeStatus } from "@/types/notice-types";
import { aiNoticeService } from "@/lib/ai/aiNoticeService";
import { db } from "@/lib/firebase/firebase";
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";

interface NoticeState {
  notices: Notice[];
  reads: NoticeRead[];
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  initializeNoticeListener: () => () => void;
  initializeReadListener: (studentId: string) => () => void;

  createNotice: (notice: Omit<Notice, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  updateNotice: (id: string, updates: Partial<Notice>) => Promise<void>;
  deleteNotice: (id: string) => Promise<void>;
  publishNotice: (id: string) => Promise<void>;
  pinNotice: (id: string, pinned: boolean) => Promise<void>;

  generateNoticeContent: (input: string, type: NoticeType, teacherName: string) => Promise<{ title: string; body: string; shortBody: string }>;

  getTeacherNotices: (teacherId: string) => Notice[];
  getStudentNotices: (studentId: string, classId?: string) => Notice[];
  getPinnedNotices: (studentId: string, classId?: string) => Notice[];
  getNotice: (id: string) => Notice | undefined;

  markAsRead: (noticeId: string, studentId: string) => Promise<void>;
  acknowledgeNotice: (noticeId: string, studentId: string) => Promise<void>;
  isRead: (noticeId: string, studentId: string) => boolean;
  isAcknowledged: (noticeId: string, studentId: string) => boolean;
  getUnreadCount: (studentId: string, classId?: string) => number;

  getNoticeAnalytics: (noticeId: string, totalStudents: number) => NoticeAnalytics;
  getTeacherNoticeStats: (teacherId: string) => {
    totalNotices: number;
    publishedThisWeek: number;
    criticalActive: number;
  };
}

export const useNoticeStore = create<NoticeState>((set, get) => ({
      notices: [],
      reads: [],
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      initializeNoticeListener: () => {
        const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const notices: Notice[] = [];
          snapshot.forEach((doc) => notices.push({ id: doc.id, ...doc.data() } as Notice));
          set({ notices });
        });
        return unsubscribe;
      },

      initializeReadListener: (studentId: string) => {
        const q = query(collection(db, "noticeReads"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const reads: NoticeRead[] = [];
          snapshot.forEach((doc) => reads.push({ id: doc.id, ...doc.data() } as unknown as NoticeRead));
          set({ reads });
        });
        return unsubscribe;
      },

      createNotice: async (params) => {
        const id = `notice_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const now = new Date().toISOString();
        const notice: Notice = { ...params, id, createdAt: now, updatedAt: now };
        
        await setDoc(doc(db, "notices", id), notice);
        set(state => ({ notices: [...state.notices, notice] }));
        return id;
      },

      updateNotice: async (id, updates) => {
        const now = new Date().toISOString();
        await updateDoc(doc(db, "notices", id), { ...updates, updatedAt: now });
        set(state => ({
          notices: state.notices.map(n => n.id === id ? { ...n, ...updates, updatedAt: now } : n)
        }));
      },

      deleteNotice: async (id) => {
        await deleteDoc(doc(db, "notices", id));
        set(state => ({
          notices: state.notices.filter(n => n.id !== id),
          reads: state.reads.filter(r => r.noticeId !== id)
        }));
      },

      publishNotice: async (id) => {
        const now = new Date().toISOString();
        await updateDoc(doc(db, "notices", id), { status: "published", updatedAt: now });
        set(state => ({
          notices: state.notices.map(n => n.id === id ? { ...n, status: "published", updatedAt: now } : n)
        }));
      },

      pinNotice: async (id, pinned) => {
        const now = new Date().toISOString();
        await updateDoc(doc(db, "notices", id), { isPinned: pinned, updatedAt: now });
        set(state => ({
          notices: state.notices.map(n => n.id === id ? { ...n, isPinned: pinned, updatedAt: now } : n)
        }));
      },

      generateNoticeContent: async (input, type, teacherName) => {
        return aiNoticeService.generateNotice(input, type, teacherName);
      },

      getTeacherNotices: (teacherId) => {
        return get().notices
          .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
      },

      getStudentNotices: (studentId, classId) => {
        const now = new Date().getTime();
        return get().notices
          .filter(n => n.status === "published")
          .filter(n => {
            if (n.expiresAt) {
              const expiry = new Date(n.expiresAt).getTime();
              if (now > expiry) return false;
            }
            return true;
          })
          .filter(n => {
            if (n.target === "all") return true;
            if (n.target === "class" && classId && n.targetClassId === classId) return true;
            if (n.target === "selected" && n.targetStudentIds?.includes(studentId)) return true;
            return false;
          })
          .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
      },

      getPinnedNotices: (studentId, classId) => {
        return get().getStudentNotices(studentId, classId).filter(n => n.isPinned);
      },

      getNotice: (id) => get().notices.find(n => n.id === id),

      markAsRead: async (noticeId, studentId) => {
        const now = new Date().toISOString();
        set(state => {
          const existing = state.reads.find(r => r.noticeId === noticeId && r.studentId === studentId);
          if (!existing) {
            const newRead: NoticeRead = {
              noticeId,
              studentId,
              readAt: now,
              acknowledged: false
            };
            return { reads: [...state.reads, newRead] };
          }
          return state;
        });
      },

      acknowledgeNotice: async (noticeId, studentId) => {
        const now = new Date().toISOString();
        set(state => {
          const existing = state.reads.find(r => r.noticeId === noticeId && r.studentId === studentId);
          if (existing) {
            return {
              reads: state.reads.map(r => r.noticeId === noticeId && r.studentId === studentId ? { ...r, acknowledged: true, acknowledgedAt: now } : r)
            };
          } else {
            const newRead: NoticeRead = {
              noticeId,
              studentId,
              readAt: now,
              acknowledged: true,
              acknowledgedAt: now
            };
            return { reads: [...state.reads, newRead] };
          }
        });
      },

      isRead: (noticeId, studentId) => {
        return get().reads.some(r => r.noticeId === noticeId && r.studentId === studentId);
      },

      isAcknowledged: (noticeId, studentId) => {
        return get().reads.some(r => r.noticeId === noticeId && r.studentId === studentId && r.acknowledged);
      },

      getUnreadCount: (studentId, classId) => {
        const { reads } = get();
        const notices = get().getStudentNotices(studentId, classId);
        
        return notices.filter(n => !reads.some(r => r.noticeId === n.id && r.studentId === studentId)).length;
      },

      getNoticeAnalytics: (noticeId, totalStudents) => {
        const { reads } = get();
        const noticeReads = reads.filter(r => r.noticeId === noticeId);
        const viewedCount = noticeReads.length;
        const acknowledgedCount = noticeReads.filter(r => r.acknowledged).length;
        
        return {
          noticeId,
          totalRecipients: totalStudents,
          viewedCount,
          unreadCount: Math.max(0, totalStudents - viewedCount),
          acknowledgedCount,
          ignoredCount: Math.max(0, viewedCount - acknowledgedCount)
        };
      },

      getTeacherNoticeStats: (teacherId) => {
        const teacherNotices = get().notices;
        
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        return {
          totalNotices: teacherNotices.length,
          publishedThisWeek: teacherNotices.filter(n => n.status === "published" && new Date(n.createdAt) > weekAgo).length,
          criticalActive: teacherNotices.filter(n => n.priority === "critical" && n.status === "published").length,
        };
      }
}));
