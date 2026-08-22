import { create } from "zustand";
import { persist } from "zustand/middleware";

import { useLeaderboardStore } from "./leaderboardStore";
import { toast } from "sonner";

export interface TestMark {
  id: string;
  studentId: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  marks: number;
  maxMarks: number;
  date: string;
  createdAt: number;
}

export interface TestStoreState {
  testMarks: TestMark[];
  addTestMark: (data: Omit<TestMark, "id" | "createdAt">) => Promise<void>;
  deleteTestMark: (id: string) => Promise<void>;
  getMarksForStudent: (studentId: string) => TestMark[];
  getMarksForClass: (classId: string) => TestMark[];
}

export const useTestStore = create<TestStoreState>()(
  persist(
    (set, get) => ({
      testMarks: [],
      addTestMark: async (data) => {
        try {
          const newMark: TestMark = {
            ...data,
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            createdAt: Date.now(),
          };
          
          set((state) => ({
            testMarks: [...state.testMarks, newMark],
          }));

          // Add points to leaderboard
          if (data.marks > 0) {
            useLeaderboardStore.getState().addPoints(
              data.studentId, 
              data.marks, 
              "Scored ${data.marks}/ in Offline Test"
            );
          }
          
          toast.success("Test marks saved successfully!");
        } catch (error: any) {
          toast.error("Failed to save test marks");
          throw error;
        }
      },
      deleteTestMark: async (id) => {
        set((state) => ({
          testMarks: state.testMarks.filter((m) => m.id !== id),
        }));
      },
      getMarksForStudent: (studentId) => {
        return get().testMarks
          .filter((m) => m.studentId === studentId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
      getMarksForClass: (classId) => {
        return get().testMarks
          .filter((m) => m.classId === classId)
          .sort((a, b) => b.createdAt - a.createdAt);
      }
    }),
    {
      name: "rudra-test-marks-storage",
    }
  )
);


