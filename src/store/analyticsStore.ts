import { create } from "zustand";
import type { StudentProgress, TopicProgress } from "@/types";
import { useAuthStore } from "./authStore";

export interface AnalyticsState {
  progress: Record<string, StudentProgress>;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  initializeAnalytics: () => void;
  getStudentProgress: (studentId: string) => StudentProgress;
  updateMastery: (studentId: string, topicId: string, topicName: string, chapterId: string, subjectId: string, score: number) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
      progress: {},
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      initializeAnalytics: () => {
        const authState = useAuthStore.getState();
        const users = typeof authState.getAllUsers === 'function' ? authState.getAllUsers() : authState.users;
        const students = users.filter(u => u.role === "student");
        
        set(state => {
          const newProgress = { ...state.progress };
          students.forEach(s => {
            if (!newProgress[s.id]) {
              newProgress[s.id] = {
                studentId: s.id,
                overallScore: 0,
                studyStreak: 0,
                studyHoursToday: 0,
                homeworkCompleted: 0,
                homeworkTotal: 0,
                topicProgress: [],
                weakTopics: [],
                strongTopics: []
              };
            }
          });
          return { progress: newProgress };
        });
      },

      getStudentProgress: (studentId) => {
        return get().progress[studentId] || {
          studentId,
          overallScore: 0,
          studyStreak: 0,
          studyHoursToday: 0,
          homeworkCompleted: 0,
          homeworkTotal: 0,
          topicProgress: [],
          weakTopics: [],
          strongTopics: []
        };
      },
      
      updateMastery: (studentId, topicId, topicName, chapterId, subjectId, score) => {
        set(state => {
          const p = state.progress[studentId] || {
            studentId,
            overallScore: 0,
            studyStreak: 0,
            studyHoursToday: 0,
            homeworkCompleted: 0,
            homeworkTotal: 0,
            topicProgress: [],
            weakTopics: [],
            strongTopics: []
          };
          
          const topics = [...p.topicProgress];
          const tIdx = topics.findIndex(t => t.topicId === topicId);
          
          if (tIdx >= 0) {
            // Update existing topic mastery
            const oldScore = topics[tIdx].masteryScore;
            // Moving average
            const newScore = Math.round((oldScore + score) / 2);
            topics[tIdx] = {
              ...topics[tIdx],
              masteryScore: newScore,
              masteryLevel: newScore >= 80 ? "mastered" : newScore >= 55 ? "practicing" : newScore >= 30 ? "learning" : "weak",
              lastPracticed: new Date().toISOString()
            };
          } else {
            // New topic
            topics.push({
              topicId,
              topicName,
              chapterId,
              subjectId,
              masteryScore: score,
              masteryLevel: score >= 80 ? "mastered" : score >= 55 ? "practicing" : score >= 30 ? "learning" : "weak",
              lastPracticed: new Date().toISOString(),
              mistakeCount: 0
            });
          }
          
          // Recompute weak and strong
          const weak = topics.filter(t => t.masteryScore < 55).map(t => t.topicName);
          const strong = topics.filter(t => t.masteryScore >= 80).map(t => t.topicName);
          
          const overall = topics.length > 0 ? Math.round(topics.reduce((acc, t) => acc + t.masteryScore, 0) / topics.length) : 0;
          
          return {
            progress: {
              ...state.progress,
              [studentId]: {
                ...p,
                topicProgress: topics,
                weakTopics: weak,
                strongTopics: strong,
                overallScore: overall
              }
            }
          };
        });
      }
    }));
