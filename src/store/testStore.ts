import { create } from "zustand";
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
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
  isLoading: boolean;
  isInitialized: boolean;
  initializeTestsListener: (role: "teacher" | "student", userId: string) => () => void;
  addTestMark: (data: Omit<TestMark, "id" | "createdAt">) => Promise<void>;
  deleteTestMark: (id: string) => Promise<void>;
  getMarksForStudent: (studentId: string) => TestMark[];
  getMarksForClass: (classId: string) => TestMark[];
}

export const useTestStore = create<TestStoreState>()((set, get) => ({
  testMarks: [],
  isLoading: false,
  isInitialized: false,

  initializeTestsListener: (role, userId) => {
    set({ isLoading: true });
    let q;
    
    if (role === "student") {
      q = query(collection(db, "test_marks"), where("studentId", "==", userId));
    } else {
      q = collection(db, "test_marks");
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const marks: TestMark[] = [];
      snapshot.forEach((doc) => {
        marks.push(doc.data() as TestMark);
      });
      set({ testMarks: marks, isLoading: false, isInitialized: true });
    }, (error) => {
      console.error("Failed to load test marks:", error);
      set({ isLoading: false });
    });

    return unsubscribe;
  },

  addTestMark: async (data) => {
    try {
      const id = "test_" + Date.now() + "_" + Math.random().toString(36).substring(7);
      const newMark: TestMark = {
        ...data,
        id,
        createdAt: Date.now(),
      };
      
      // Save to Firestore
      await setDoc(doc(db, "test_marks", id), newMark);

      // Add points to leaderboard
      if (data.marks > 0) {
        useLeaderboardStore.getState().addPoints(
          data.studentId, 
          data.marks, 
          `Scored ${data.marks}/20 in Offline Test`
        );
      }
      
      toast.success("Test marks saved successfully!");
    } catch (error: any) {
      toast.error("Failed to save test marks");
      throw error;
    }
  },

  deleteTestMark: async (id) => {
    try {
      await deleteDoc(doc(db, "test_marks", id));
      toast.success("Deleted test mark");
    } catch (err) {
      console.error("Failed to delete test mark", err);
      toast.error("Failed to delete test mark");
    }
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
}));
