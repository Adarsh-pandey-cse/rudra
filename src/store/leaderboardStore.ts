import { create } from "zustand";

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
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      initializeLeaderboard: () => {
        // Automatically populate leaderboard entries from student users
        const authState = useAuthStore.getState();
        const users = typeof authState.getAllUsers === 'function' ? authState.getAllUsers() : authState.users;
        const students = users.filter(u => u.role === "student" && (u as any).status !== "archived");
        
        set(state => {
          let hasChanges = false;
          const currentEntries = [...state.entries];
          
          students.forEach(s => {
            const existing = currentEntries.find(e => e.studentId === s.id);
            if (!existing) {
              hasChanges = true;
              currentEntries.push({
                studentId: s.id,
                name: s.name,
                avatar: s.avatar,
                class: (s as any).classId || (s as any).grade || "-",
                points: (s as any).points || 0,
                homeworkCount: (s as any).homeworkCount || 0,
                accuracy: 0,
                streak: (s as any).streak || 0,
                rank: 0
              } as any);
            }
          });
          
          if (!hasChanges) {
            return state; // No changes, return existing state to prevent re-renders
          }
          
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
      
      addPoints: (studentId, points, reason) => {
        set(state => {
          const entries = [...state.entries];
          const entryIndex = entries.findIndex(e => e.studentId === studentId);
          
          let previousRank = 0;
          if (entryIndex >= 0) {
            previousRank = entries[entryIndex].rank;
            entries[entryIndex] = {
              ...entries[entryIndex],
              points: entries[entryIndex].points + points,
              homeworkCount: entries[entryIndex].homeworkCount + 1,
            };
          } else {
            // Find student details from auth store
            const authState = useAuthStore.getState();
            const users = typeof authState.getAllUsers === 'function' ? authState.getAllUsers() : authState.users;
            const student = users.find(u => u.id === studentId);
            if (student) {
              entries.push({
                studentId: student.id,
                name: student.name,
                avatar: student.avatar,
                class: (student as any).classId || (student as any).grade || "-",
                points: points,
                homeworkCount: 1,
                accuracy: 0,
                streak: 0,
                rank: 0
              } as any);
            }
          }
          
          // Re-sort and rank
          entries.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.streak !== a.streak) return b.streak - a.streak;
            return a.name.localeCompare(b.name);
          });
          
          let newRank = 0;
          entries.forEach((e, i) => {
            e.rank = i + 1;
            if (e.studentId === studentId) {
              newRank = e.rank;
            }
          });

          // Update points in authStore to sync student profile points
          // NOTE: Per requirement 3 & 6, we read/write to authStore
          const authStore = useAuthStore.getState();
          const studentIndex = authStore.users.findIndex(u => u.id === studentId);
          if (studentIndex >= 0) {
            const updatedUsers = [...authStore.users];
            const currentPoints = (updatedUsers[studentIndex] as any).points || 0;
            const currentHomework = (updatedUsers[studentIndex] as any).homeworkCount || 0;
            const updatedUser = {
              ...updatedUsers[studentIndex],
              points: currentPoints + points,
              homeworkCount: currentHomework + 1
            };
            updatedUsers[studentIndex] = updatedUser;
            
            const isCurrent = authStore.currentUser?.id === studentId;
            useAuthStore.setState({
              users: updatedUsers,
              currentUser: isCurrent ? updatedUser : authStore.currentUser
            });
          }
          
          // Emit LEADERBOARD_UPDATED
          eventBus.emit({
            type: "LEADERBOARD_UPDATED",
            payload: {
              studentId,
              points,
              newRank,
              previousRank
            }
          });
          
          return { entries };
        });
      },

      updateStreak: (studentId, reset) => {
        set(state => {
          const entries = [...state.entries];
          const entryIndex = entries.findIndex(e => e.studentId === studentId);
          if (entryIndex >= 0) {
            entries[entryIndex] = {
              ...entries[entryIndex],
              streak: reset ? 0 : (entries[entryIndex].streak || 0) + 1
            };
            
            // Also sync to authStore for persistence
            const authStore = useAuthStore.getState();
            const studentIndex = authStore.users.findIndex(u => u.id === studentId);
            if (studentIndex >= 0) {
              const updatedUsers = [...authStore.users];
              updatedUsers[studentIndex] = {
                ...updatedUsers[studentIndex],
                streak: entries[entryIndex].streak
              } as any;
              useAuthStore.setState({ users: updatedUsers });
            }
          }
          return { entries };
        });
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
          unsub1();
          unsub2();
        };
      }
}));
