import { create } from "zustand";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import type { LeaderboardEntry } from "@/types/homework-types";
import { useAuthStore } from "./authStore";
import { eventBus } from "@/lib/eventBus";

export interface LeaderboardState {
  entries: LeaderboardEntry[];
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  initializeLeaderboard: () => void;
  getLeaderboard: (classId?: string, subjectId?: string, period?: "weekly" | "monthly" | "all_time") => LeaderboardEntry[];
  addPoints: (studentId: string, points: number, reason: string) => void;
  updateStreak: (studentId: string, reset: boolean) => void;
  validateStreaks: () => void;
  setupEventListeners: () => () => void;
}

export const useLeaderboardStore = create<LeaderboardState>()((set, get) => ({
      entries: [],
      _hasHydrated: true,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      initializeLeaderboard: () => {
        const authState = useAuthStore.getState();
        const users = typeof authState.getAllUsers === 'function' ? authState.getAllUsers() : authState.users;
        const students = users.filter(u => u.role === "student" && (u as any).status !== "archived");
        
        set(state => {
          const currentEntries = [...state.entries];
          
          students.forEach(s => {
            const existingIndex = currentEntries.findIndex(e => e.studentId === s.id);
            const entryData = {
              studentId: s.id,
              name: s.name,
              avatar: s.avatar,
              class: (s as any).classId || (s as any).grade || "-",
              points: (s as any).points || 0,
              homeworkCount: (s as any).homeworkCount || 0,
              accuracy: 0,
              streak: (s as any).streak || 0,
              rank: 0
            };
            
            if (existingIndex >= 0) {
              currentEntries[existingIndex] = { ...currentEntries[existingIndex], ...entryData };
            } else {
              currentEntries.push(entryData as any);
            }
          });
          
          // Sort and assign ranks
          currentEntries.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.streak !== a.streak) return b.streak - a.streak;
            return a.name.localeCompare(b.name);
          });
          currentEntries.forEach((e, i) => e.rank = i + 1);
          
          return { entries: currentEntries };
        });
        get().validateStreaks();
      },

      getLeaderboard: (classId, subjectId, period) => {
        // In a real app with Firebase, this would filter by class/subject/period from the DB
        // For local mock, we return the sorted global entries
        const authState = useAuthStore.getState();
        const users = typeof authState.getAllUsers === 'function' ? authState.getAllUsers() : authState.users;
        
        // Attach the latest avatar from authStore to ensure the DP is always visible
        let currentEntries = get().entries.map(e => {
          const user = users.find(u => u.id === e.studentId);
          return { ...e, avatar: user?.avatar || e.avatar };
        });
        
        // If classId is provided, filter by students in that class
        if (classId) {
          const studentsInClass = users.filter(u => u.role === "student" && ((u as any).classId === classId || String((u as any).grade || "").replace(/\D/g, '') === String(classId).replace(/\D/g, ''))).map(u => u.id);
          currentEntries = currentEntries.filter(e => studentsInClass.includes(e.studentId));
        }
        
        currentEntries.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.streak !== a.streak) return b.streak - a.streak;
          return a.name.localeCompare(b.name);
        });
        currentEntries.forEach((e, i) => e.rank = i + 1);
        
        return currentEntries;
      },
      
      addPoints: async (studentId, points, reason) => {
        try {
          const userRef = doc(db, "users", studentId);
          await updateDoc(userRef, {
            points: increment(points),
            homeworkCount: increment(1)
          });
          
          const currentEntry = get().entries.find(e => e.studentId === studentId);
          const previousRank = currentEntry ? currentEntry.rank : 0;
          
          eventBus.emit({
            type: "LEADERBOARD_UPDATED",
            payload: {
              studentId,
              points,
              newRank: previousRank, // Will be calculated after authStore sync
              previousRank
            }
          });
        } catch (error) {
          console.error("Failed to add points to Firestore", error);
        }
      },

      updateStreak: async (studentId, reset) => {
        try {
          const userRef = doc(db, "users", studentId);
          if (reset) {
            await updateDoc(userRef, { streak: 0 });
          } else {
            await updateDoc(userRef, { streak: increment(1) });
          }
        } catch (error) {
          console.error("Failed to update streak in Firestore", error);
        }
      },

      validateStreaks: () => {
        // Dynamic import to avoid circular dependencies
        import('./homeworkStore').then(({ useHomeworkStore }) => {
          const { assignments, submissions } = useHomeworkStore.getState();
          const now = new Date();
          
          set(state => {
            const entries = [...state.entries];
            let changed = false;
            
            entries.forEach(entry => {
              if (entry.streak > 0) {
                // Find all assignments assigned to this student
                const studentAssignments = assignments.filter(a => {
                  if ((a as any).targetClassId && (a as any).targetClassId !== "-") {
                    const authState = useAuthStore.getState();
                    const student = (authState.getAllUsers ? authState.getAllUsers() : authState.users).find(u => u.id === entry.studentId);
                    const studentClassId = (student as any)?.classId || (student as any)?.grade;
                    return studentClassId === (a as any).targetClassId;
                  }
                  return (a as any).assignedTo?.includes(entry.studentId) || (a as any).recipientStudentIds?.includes(entry.studentId);
                });
                
                // Check if any assignment is past due and NOT submitted
                const hasMissedAssignment = studentAssignments.some(a => {
                  const dueDate = new Date(a.dueDate);
                  if (now > dueDate) {
                    const sub = submissions.find(s => s.assignmentId === a.id && s.studentId === entry.studentId);
                    return !sub; // Not submitted and past due date
                  }
                  return false;
                });
                
                if (hasMissedAssignment) {
                  entry.streak = 0;
                  changed = true;
                  
                  // Sync to auth store
                  const authStore = useAuthStore.getState();
                  const studentIndex = authStore.users.findIndex(u => u.id === entry.studentId);
                  if (studentIndex >= 0) {
                    const updatedUsers = [...authStore.users];
                    updatedUsers[studentIndex] = { ...updatedUsers[studentIndex], streak: 0 } as any;
                    useAuthStore.setState({ users: updatedUsers });
                  }
                }
              }
            });
            
            return changed ? { entries } : state;
          });
        });
      },

      setupEventListeners: () => {
        // Subscribe to authStore changes (which are synced live from Firestore)
        const unsubAuth = useAuthStore.subscribe((state, prevState) => {
          if (state.users !== prevState.users) {
            get().initializeLeaderboard();
          }
        });

        const unsub1 = eventBus.on("HOMEWORK_GRADED", (event) => {
          if (event.payload && event.payload.studentId && event.payload.grade !== undefined) {
            get().addPoints(event.payload.studentId, event.payload.grade, "Homework graded");
          }
        });
        
        const unsub2 = eventBus.on("HOMEWORK_SUBMITTED", (event) => {
          if (event.payload && event.payload.studentId) {
            get().addPoints(event.payload.studentId, 10, "Homework submitted");
            get().updateStreak(event.payload.studentId, !!(event.payload as any).isLate);
          }
        });
        
        return () => {
          unsubAuth();
          unsub1();
          unsub2();
        };
      }
}));
