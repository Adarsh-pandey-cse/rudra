import { create } from "zustand";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import type { LeaderboardEntry } from "@/types/homework-types";
import { useAuthStore } from "./authStore";
import { useHomeworkStore } from "./homeworkStore";
import { eventBus } from "@/lib/eventBus";

export interface LeaderboardState {
  entries: LeaderboardEntry[];
  isInitialized: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  initializeLeaderboard: () => void;
  getLeaderboard: (classId?: string, subjectId?: string, period?: "weekly" | "monthly" | "all_time") => LeaderboardEntry[];
  addPoints: (studentId: string, points: number, reason: string) => void;
    adjustPoints: (studentId: string, points: number, reason: string) => void;
  updateStreak: (studentId: string, change: number | "reset") => void;
  validateStreaks: () => void;
  setupEventListeners: () => () => void;
}

export const useLeaderboardStore = create<LeaderboardState>()((set, get) => ({
      entries: [],
      isInitialized: false,
      _hasHydrated: true,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      initializeLeaderboard: () => {
        const authState = useAuthStore.getState();
        const users = typeof authState.getAllUsers === 'function' ? authState.getAllUsers() : authState.users;
        const students = users.filter(u => u.role === "student" && (u as any).status !== "archived" && (u as any).status !== "deleted");
        
        set(state => {
          const activeStudentIds = students.map(s => s.id);
          const currentEntries = state.entries.filter(e => activeStudentIds.includes(e.studentId));
            const submissions = useHomeworkStore.getState().submissions;
          
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
                lastSubmissionAt: submissions.filter(sub => sub.studentId === s.id && sub.submittedAt).reduce((max, sub) => Math.max(max, new Date(sub.submittedAt || 0).getTime()), 0),
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
            if (b.points !== a.points) return (b.points || 0) - (a.points || 0);
            if (b.streak !== a.streak) return (b.streak || 0) - (a.streak || 0);
            return 0; // If points and streak match, they are a complete tie!
          });
          
          let currentRank = 1;
          for (let i = 0; i < currentEntries.length; i++) {
            if (i > 0) {
              const prev = currentEntries[i - 1];
              const curr = currentEntries[i];
              if (prev.points === curr.points && prev.streak === curr.streak) {
                curr.rank = prev.rank;
              } else {
                curr.rank = i + 1;
              }
            } else {
              currentEntries[i].rank = 1;
            }
          }
          
          return { entries: currentEntries, isInitialized: true };
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
            if (b.points !== a.points) return (b.points || 0) - (a.points || 0);
            if (b.streak !== a.streak) return (b.streak || 0) - (a.streak || 0);
            return 0; // If points and streak match, they are a complete tie!
          });
          
          let currentRank = 1;
          for (let i = 0; i < currentEntries.length; i++) {
            if (i > 0) {
              const prev = currentEntries[i - 1];
              const curr = currentEntries[i];
              if (prev.points === curr.points && prev.streak === curr.streak) {
                curr.rank = prev.rank;
              } else {
                curr.rank = i + 1;
              }
            } else {
              currentEntries[i].rank = 1;
            }
          }
        
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

      adjustPoints: async (studentId, points, reason) => {
        try {
          const userRef = doc(db, "users", studentId);
          await updateDoc(userRef, {
            points: increment(points)
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
          console.error("Error adjusting points:", error);
        }
      },

      updateStreak: async (studentId, change) => {
        try {
          const userRef = doc(db, "users", studentId);
          if (change === "reset") {
            await updateDoc(userRef, { streak: 0 });
            useAuthStore.setState((state) => ({
              users: state.users.map((u) => u.id === studentId ? { ...u, streak: 0 } : u)
            }));
          } else if (change !== 0) {
            const authState = useAuthStore.getState();
            const student = authState.users.find(u => u.id === studentId);
            const newStreak = Math.max(0, ((student as any)?.streak || 0) + change);
            
            useAuthStore.setState((state) => ({
              users: state.users.map((u) => 
                u.id === studentId 
                  ? { ...u, streak: newStreak } 
                  : u
              )
            }));
            
            await updateDoc(userRef, { streak: newStreak });
          }
        } catch (error) {
          console.error("Failed to update streak in Firestore", error);
        }
      },

            validateStreaks: () => {
        import('./homeworkStore').then(({ useHomeworkStore }) => {
          const { assignments, submissions } = useHomeworkStore.getState();
          const authState = useAuthStore.getState();
          const users = typeof authState.getAllUsers === 'function' ? authState.getAllUsers() : authState.users;
          const students = users.filter(u => u.role === "student" && (u as any).status !== "archived" && (u as any).status !== "deleted");
          
          const now = new Date().getTime();
          
          students.forEach(async student => {
            const studentAssignments = assignments.filter(a => {
              const targetClass = (a as any).targetClassId;
              if (targetClass && targetClass !== "-") {
                const studentClassId = (student as any)?.classId || (student as any)?.grade;
                return studentClassId === targetClass;
              }
              return (a as any).assignedTo?.includes(student.id) || (a as any).recipientStudentIds?.includes(student.id);
            });
            
            // Sort assignments by due date to compute chronologically
            studentAssignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
            
            let calculatedStreak = 0;
            
            studentAssignments.forEach(a => {
              const dueDate = new Date(a.dueDate).getTime();
              const submission = submissions.find(s => s.assignmentId === a.id && s.studentId === student.id);
              
              const isSubmitted = submission && !["pending", "draft"].includes((submission.status as any)) && !submission.isLate;
              
              if (isSubmitted) {
                // If rejected, they don't get the +1 streak (cancels out fake submission). 
                // We do NOT penalize past streak, we just don't award it here.
                if (submission.status !== "rejected" && !submission.isLate) {
                  calculatedStreak++;
                }
              } else if (now > dueDate) {
                // Missed deadline
                calculatedStreak = 0;
              }
            });
            
            const currentStreak = (student as any).streak || 0;
            if (currentStreak !== calculatedStreak) {
              // Sync the correct streak to Firestore
              try {
                await updateDoc(doc(db, "users", student.id), { streak: calculatedStreak });
                useAuthStore.setState((state) => ({
                  users: state.users.map((u) => u.id === student.id ? { ...u, streak: calculatedStreak } : u)
                }));
              } catch(e) {
                console.error("Failed to sync streak", e);
              }
            }
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
          const payload = event.payload as any;
          if (payload && payload.studentId && payload.grade !== undefined) {
            get().addPoints(payload.studentId, payload.grade, "Homework graded");
          }
        });
        
        const unsub2 = eventBus.on("HOMEWORK_SUBMITTED", (event) => {
          const payload = event.payload as any;
          if (payload && payload.studentId) {
            get().updateStreak(payload.studentId, 1);
          }
        });

        const unsub3 = eventBus.on("HOMEWORK_REJECTED", (event) => {
          const payload = event.payload as any;
          if (payload && payload.studentId) {
            get().updateStreak(payload.studentId, -1);
          }
        });
        
        return () => {
          unsubAuth();
          unsub1();
          unsub2();
          unsub3();
        };
      }
}));






