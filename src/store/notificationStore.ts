import { create } from 'zustand';
import { db } from "@/lib/firebase/firebase";
import { collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy, where, deleteDoc, getDoc } from "firebase/firestore";
import { eventBus } from '@/lib/eventBus';

export interface AppNotification {
  id: string;
  recipientId: 'all_teachers' | string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (recipientId: string) => void;
  clearAll: (userId: string, role?: string) => void;
  getUserNotifications: (userId: string, role: string) => AppNotification[];
  setupEventListeners: () => () => void;
}

const displayedToasts = new Set<string>();

export const useNotificationStore = create<NotificationState>((set, get) => ({
      notifications: [],
      addNotification: async (notification) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newNotif = {
          ...notification,
          id,
          read: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "notifications", id), newNotif as any);
        set((state) => ({ notifications: [newNotif as any, ...state.notifications] }));
        
        // Trigger push notification via Vercel backend
        if (notification.recipientId !== 'all_teachers') {
          try {
            const userDoc = await getDoc(doc(db, "users", notification.recipientId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.fcmToken) {
                await fetch('/api/notify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    token: userData.fcmToken,
                    title: newNotif.title,
                    message: newNotif.message,
                    link: newNotif.link
                  })
                }).then(async res => {
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    import("sonner").then(({ toast }) => {
                      toast.error("Push Notification Failed", { 
                        description: err.error || "Server error in /api/notify. Check Vercel logs.",
                        duration: 8000
                      });
                    });
                  }
                }).catch(e => {
                  console.error("FCM Fetch Error:", e);
                  import("sonner").then(({ toast }) => {
                    toast.error("Push Notification Network Error", { 
                      description: "Failed to connect to /api/notify",
                      duration: 8000
                    });
                  });
                });
              }
            }
          } catch(e) {
            console.error("Error triggering push notification", e);
          }
        }
      },
      markAsRead: async (id) => {
        await updateDoc(doc(db, "notifications", id), { read: true });
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          )
        }));
      },
      markAllAsRead: (recipientId) => set((state) => ({
        notifications: state.notifications.map((n) =>
          (n.recipientId === recipientId || n.recipientId === 'all_teachers') ? { ...n, read: true } : n
        )
      })),
      clearAll: (userId, role) => {
        const { notifications } = get();
        
        // Delete from Firestore
        notifications.forEach((n) => {
          let shouldClear = false;
          if (role === 'teacher' || role === 'admin') {
             if (n.recipientId === 'all_teachers' || n.recipientId === userId) shouldClear = true;
          } else {
             if (n.recipientId === userId) shouldClear = true;
          }
          
          if (shouldClear) {
             deleteDoc(doc(db, "notifications", n.id)).catch(console.error);
          }
        });
        
        // Update local state immediately
        set((state) => ({
          notifications: state.notifications.filter((n) => {
            if (role === 'teacher' || role === 'admin') {
              return !(n.recipientId === 'all_teachers' || n.recipientId === userId);
            }
            return n.recipientId !== userId;
          })
        }));
      },
      getUserNotifications: (userId, role) => {
        const { notifications } = get();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return notifications.filter((n) => {
          const isRecent = new Date(n.createdAt) > sevenDaysAgo;
          if (!isRecent) return false;

          if (role === 'teacher' || role === 'admin') {
            return n.recipientId === 'all_teachers' || n.recipientId === userId;
          }
          return n.recipientId === userId;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      setupEventListeners: () => {
        const unsubs: (() => void)[] = [];

        const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));

        const fbUnsub = onSnapshot(q, async (snapshot) => {
          const { useAuthStore } = await import("./authStore");
          const currentUser = useAuthStore.getState().currentUser;
          
          // 7-day auto-cleanup
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.createdAt && new Date(data.createdAt) < sevenDaysAgo) {
              deleteDoc(docSnap.ref).catch(console.error);
            }
          });
          
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const notif = change.doc.data() as AppNotification;
              
              // 5-minute window to account for large clock drifts between devices
              const fiveMinutesAgo = new Date();
              fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
              const isRecent = new Date(notif.createdAt) > fiveMinutesAgo;
              
              if (isRecent && currentUser && (notif.recipientId === currentUser.id || (notif.recipientId === 'all_teachers' && currentUser.role === 'teacher'))) {
                if (!displayedToasts.has(notif.id)) {
                  displayedToasts.add(notif.id);
                  try {
                    const { toast } = await import("sonner");
                    if (toast) {
                      toast(notif.title, {
                        description: notif.message,
                        duration: 4000,
                        action: notif.link ? {
                          label: 'View',
                          onClick: () => {
                            window.location.href = notif.link as string;
                          }
                        } : undefined,
                      });
                    }
                  } catch (err) {
                    console.warn("Failed to trigger toast on mobile", err);
                  }
                }
              }
            }
          });

          const notifications: AppNotification[] = [];
          snapshot.forEach((doc) => notifications.push({ id: doc.id, ...doc.data() } as AppNotification));
          set({ notifications });
        });
        unsubs.push(fbUnsub);

        // Subscribes to HOMEWORK_ASSIGNED: create notification for each student
        unsubs.push(eventBus.on('HOMEWORK_ASSIGNED', (event) => {
          const { studentIds, title, assignmentId } = event.payload;
          if (studentIds && studentIds.length > 0) {
            studentIds.forEach((studentId: string) => {
              get().addNotification({
                recipientId: studentId,
                title: 'New Homework Assigned',
                message: `You have been assigned new homework: ${title}`,
                link: `/dashboard/student/homework/${assignmentId}`
              });
            });
          }
        }));

        // Subscribes to HOMEWORK_SUBMITTED: create notification for teacher  
        unsubs.push(eventBus.on('HOMEWORK_SUBMITTED', (event) => {
          const { assignmentId, teacherId, title } = event.payload as any; // fallback if title/teacherId not in payload directly
          // We can use 'all_teachers' as a fallback, but the event should be enough to notify the assigned teacher
          get().addNotification({
            recipientId: teacherId || 'all_teachers',
            title: 'Homework Submitted',
            message: `A student has submitted homework.`,
            link: `/dashboard/teacher/homework/analytics/${assignmentId}`
          });
        }));

        // Subscribes to HOMEWORK_GRADED: create notification for student with grade
        unsubs.push(eventBus.on('HOMEWORK_GRADED', (event) => {
          const { studentId, assignmentId, grade, maxMarks, title } = event.payload;
          get().addNotification({
            recipientId: studentId,
            title: 'Homework Graded',
            message: `Your homework "${title}" has been graded: ${grade}/${maxMarks}`,
            link: `/dashboard/student/homework/${assignmentId}`
          });
        }));

        // Subscribes to HOMEWORK_REJECTED: create notification for student with reason
        unsubs.push(eventBus.on('HOMEWORK_REJECTED', (event) => {
          const { studentId, assignmentId, reason, title } = event.payload;
          get().addNotification({
            recipientId: studentId,
            title: 'Homework Rejected',
            message: `Your submission for "${title}" was rejected. Reason: ${reason || 'Please see details.'}`,
            link: `/dashboard/student/homework/${assignmentId}`
          });
        }));

        // Subscribes to HOMEWORK_RESUBMISSION_REQUESTED: create notification for student with remarks
        unsubs.push(eventBus.on('HOMEWORK_RESUBMISSION_REQUESTED', (event) => {
          const { studentId, assignmentId, remarks, title } = event.payload;
          get().addNotification({
            recipientId: studentId,
            title: 'Resubmission Requested',
            message: `Resubmission requested for "${title}". Remarks: ${remarks || 'Please see details.'}`,
            link: `/dashboard/student/homework/${assignmentId}`
          });
        }));

        // Subscribes to LEADERBOARD_UPDATED: create notification for student about rank change
        unsubs.push(eventBus.on('LEADERBOARD_UPDATED', (event) => {
          const { studentId, newRank, previousRank } = event.payload;
          if (studentId && newRank && previousRank && newRank < previousRank && previousRank > 0) {
            get().addNotification({
              recipientId: studentId,
              title: 'Rank Improved!',
              message: `Your rank in Leaderboard improved from ${previousRank} to ${newRank}! Keep it up!`,
              link: `/dashboard/student/leaderboard`
            });
          }
        }));

        // Subscribes to HOMEWORK_DEADLINE_EXTENDED: notify unsubmitted students
        unsubs.push(eventBus.on('HOMEWORK_DEADLINE_EXTENDED', (event) => {
          const { assignmentId, title, studentIds, newDate } = event.payload;
          if (studentIds && Array.isArray(studentIds)) {
            const dateStr = new Date(newDate).toLocaleString(undefined, { 
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            });
            studentIds.forEach(studentId => {
              get().addNotification({
                recipientId: studentId,
                title: 'Deadline Extended',
                message: `The deadline for "${title}" has been extended to ${dateStr}.`,
                link: `/dashboard/student/homework/${assignmentId}`
              });
            });
          }
        }));

        return () => {
          unsubs.forEach(unsub => unsub());
        };
      }
    })
);

