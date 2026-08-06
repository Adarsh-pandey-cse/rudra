import { create } from "zustand";

import type {
  StudentProgress,
  TopicProgress,
  Homework,
  TeacherStats,
  StudentStats,
  Subject,
  getMasteryLevel,
  HomeworkStatus,
} from "@/types";

// ─── Seed Subjects ─────────────────────────────────────────────
const SUBJECTS: Subject[] = [
  { id: "math", name: "Mathematics", icon: "Calculator", color: "#4F46E5" },
  { id: "science", name: "Science", icon: "Flask", color: "#10B981" },
  { id: "english", name: "English", icon: "BookOpen", color: "#2563EB" },
  { id: "hindi", name: "Hindi", icon: "Languages", color: "#F59E0B" },
  { id: "social", name: "Social Studies", icon: "Globe", color: "#EC4899" },
];

// ─── Seed Topic Progress (for demo students) ──────────────────
function generateTopicProgress(studentId: string): TopicProgress[] {
  const topics = [
    { id: "alg-1", name: "Linear Equations", chapterId: "ch1", subjectId: "math" },
    { id: "alg-2", name: "Quadratic Equations", chapterId: "ch1", subjectId: "math" },
    { id: "geo-1", name: "Triangles", chapterId: "ch2", subjectId: "math" },
    { id: "phy-1", name: "Laws of Motion", chapterId: "ch3", subjectId: "science" },
    { id: "phy-2", name: "Thermodynamics", chapterId: "ch4", subjectId: "science" },
    { id: "che-1", name: "Periodic Table", chapterId: "ch5", subjectId: "science" },
    { id: "eng-1", name: "Grammar Basics", chapterId: "ch6", subjectId: "english" },
    { id: "eng-2", name: "Essay Writing", chapterId: "ch7", subjectId: "english" },
  ];

  // Seeded random based on studentId for consistency
  const seed = studentId.charCodeAt(1) || 42;
  return topics.map((t, i) => {
    const score = Math.min(100, Math.max(5, ((seed * (i + 1) * 17) % 100)));
    const level = score >= 80 ? "mastered" as const
      : score >= 55 ? "practicing" as const
      : score >= 30 ? "learning" as const
      : "weak" as const;
    return {
      topicId: t.id,
      topicName: t.name,
      chapterId: t.chapterId,
      subjectId: t.subjectId,
      masteryScore: score,
      masteryLevel: level,
      lastPracticed: new Date(Date.now() - (i * 86400000)).toISOString(),
      mistakeCount: Math.floor((100 - score) / 10),
    };
  });
}

function generateHomework(studentId: string): Homework[] {
  const seed = studentId.charCodeAt(1) || 42;
  return [
    {
      id: `hw-${studentId}-1`,
      title: "Chapter 4 — Quadratic Equations",
      subjectId: "math",
      type: "Practice Questions",
      difficulty: "Medium",
      assignedBy: "t1",
      assignedDate: new Date(Date.now() - 2 * 86400000).toISOString(),
      dueDate: new Date(Date.now() + 1 * 86400000).toISOString(),
      allowLateSubmission: false,
      maxGrade: 20,
      evaluationMethod: "Teacher + AI",
      visibility: "Immediate",
      status: seed % 3 === 0 ? "submitted" as const : "pending" as const,
      grade: seed % 3 === 0 ? Math.floor(seed % 15) + 5 : undefined,
    },
    {
      id: `hw-${studentId}-2`,
      title: "Essay — My Ambition",
      subjectId: "english",
      type: "Writing",
      difficulty: "Easy",
      assignedBy: "t1",
      assignedDate: new Date(Date.now() - 4 * 86400000).toISOString(),
      dueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
      allowLateSubmission: true,
      lateSubmissionWindow: 24,
      maxGrade: 25,
      evaluationMethod: "Teacher Only",
      visibility: "Immediate",
      status: "graded" as const,
      grade: Math.floor(seed % 18) + 7,
    },
    {
      id: `hw-${studentId}-3`,
      title: "Lab Report — Friction Experiment",
      subjectId: "science",
      type: "Lab Work",
      difficulty: "Hard",
      assignedBy: "t2",
      assignedDate: new Date(Date.now() - 1 * 86400000).toISOString(),
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      allowLateSubmission: false,
      maxGrade: 15,
      evaluationMethod: "Teacher + AI",
      visibility: "Scheduled",
      status: "pending" as const,
    },
  ];
}

// ─── Store ─────────────────────────────────────────────────────
interface DataState {
  subjects: Subject[];
  studentProgressMap: Record<string, StudentProgress>;
  homeworkMap: Record<string, Homework[]>;
  teacherAssignments: Record<string, Homework>;

  initStudentData: (studentId: string) => void;
  getStudentProgress: (studentId: string) => StudentProgress | null;
  getStudentHomework: (studentId: string) => Homework[];
  getTeacherStats: (studentIds: string[]) => TeacherStats;
  getStudentStats: (studentId: string) => StudentStats;
  getAllStudentProgress: () => Record<string, StudentProgress>;
  getTeacherAssignments: (teacherId: string) => Homework[];
  
  assignHomeworkToAll: (studentIds: string[], homeworkParams: Omit<Homework, 'id' | 'status' | 'grade'>) => void;
  updateHomework: (assignmentId: string, updates: Partial<Homework>) => void;
  deleteHomework: (assignmentId: string) => void;
  updateHomeworkStatus: (studentId: string, homeworkId: string, status: HomeworkStatus) => void;
  gradeHomework: (studentId: string, homeworkId: string, grade: number) => void;
}

export const useDataStore = create<DataState>()((set, get) => ({
      subjects: SUBJECTS,
      studentProgressMap: {},
      homeworkMap: {},
      teacherAssignments: {},

      initStudentData: (studentId: string) => {
        const { studentProgressMap, homeworkMap } = get();
        if (studentProgressMap[studentId]) return; // already initialized

        const topicProgress = generateTopicProgress(studentId);
        const avgScore = Math.round(
          topicProgress.reduce((sum, t) => sum + t.masteryScore, 0) / topicProgress.length
        );

        const progress: StudentProgress = {
          studentId,
          overallScore: avgScore,
          studyStreak: Math.floor(Math.random() * 15) + 1,
          studyHoursToday: Math.round(Math.random() * 4 * 10) / 10,
          homeworkCompleted: 1,
          homeworkTotal: 3,
          topicProgress,
          weakTopics: topicProgress.filter((t) => t.masteryScore < 40).map((t) => t.topicName),
          strongTopics: topicProgress.filter((t) => t.masteryScore >= 75).map((t) => t.topicName),
        };

        const homework = generateHomework(studentId);

        set({
          studentProgressMap: { ...studentProgressMap, [studentId]: progress },
          homeworkMap: { ...homeworkMap, [studentId]: homework },
        });
      },

      getStudentProgress: (studentId: string) => {
        return get().studentProgressMap[studentId] ?? null;
      },

      getStudentHomework: (studentId: string) => {
        return get().homeworkMap[studentId] ?? [];
      },

      getTeacherStats: (studentIds: string[]) => {
        const { studentProgressMap } = get();
        const progresses = studentIds
          .map((id) => studentProgressMap[id])
          .filter(Boolean);

        const total = studentIds.length;
        const activeToday = Math.min(total, Math.max(1, Math.floor(total * 0.7)));
        const avgScore = progresses.length
          ? Math.round(progresses.reduce((s, p) => s + p.overallScore, 0) / progresses.length)
          : 0;
        const atRisk = progresses.filter((p) => p.overallScore < 40).length;
        const hwPending = progresses.reduce(
          (s, p) => s + (p.homeworkTotal - p.homeworkCompleted),
          0
        );

        return {
          totalStudents: total,
          activeToday,
          homeworkPending: hwPending,
          avgClassScore: avgScore,
          syllabusProgress: Math.min(95, 40 + total * 3),
          studentsAtRisk: atRisk,
        };
      },

      getStudentStats: (studentId: string) => {
        const progress = get().studentProgressMap[studentId];
        const homework = get().homeworkMap[studentId] ?? [];

        if (!progress) {
          return {
            masteryScore: 0,
            studyStreak: 0,
            homeworkPending: 0,
            revisionDue: 0,
            examCountdown: 14,
            studyHoursToday: 0,
          };
        }

        return {
          masteryScore: progress.overallScore,
          studyStreak: progress.studyStreak,
          homeworkPending: homework.filter((h) => h.status === "pending").length,
          revisionDue: progress.topicProgress.filter((t) => t.masteryScore < 60).length,
          examCountdown: 14,
          studyHoursToday: progress.studyHoursToday,
        };
      },

      getAllStudentProgress: () => {
        return get().studentProgressMap;
      },

      getTeacherAssignments: (teacherId: string) => {
        const { teacherAssignments } = get();
        return Object.values(teacherAssignments).filter(a => a.assignedBy === teacherId).sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
      },

      assignHomeworkToAll: (studentIds, params) => {
        const { homeworkMap, teacherAssignments } = get();
        const newHomeworkMap = { ...homeworkMap };
        const baseId = `hw-new-${Date.now()}`;
        
        // Save the master assignment record
        const masterAssignment: Homework = {
          ...params,
          id: baseId,
          status: "pending" as const,
        };
        
        studentIds.forEach(id => {
          const current = newHomeworkMap[id] || [];
          newHomeworkMap[id] = [
            ...current,
            masterAssignment // we reuse the same ID for students to link them
          ];
        });
        
        set({ 
          homeworkMap: newHomeworkMap,
          teacherAssignments: { ...teacherAssignments, [baseId]: masterAssignment }
        });
      },

      deleteHomework: (assignmentId: string) => {
        const { homeworkMap, teacherAssignments } = get();
        
        // Remove from master records
        const newTeacherAssignments = { ...teacherAssignments };
        delete newTeacherAssignments[assignmentId];
        
        // Remove from all students
        const newHomeworkMap = { ...homeworkMap };
        Object.keys(newHomeworkMap).forEach(studentId => {
          newHomeworkMap[studentId] = newHomeworkMap[studentId].filter(hw => hw.id !== assignmentId);
        });
        
        set({ 
          teacherAssignments: newTeacherAssignments,
          homeworkMap: newHomeworkMap
        });
      },

      updateHomework: (assignmentId: string, updates: Partial<Homework>) => {
        const { homeworkMap, teacherAssignments } = get();
        
        // Update master record
        const master = teacherAssignments[assignmentId];
        if (!master) return;
        const updatedMaster = { ...master, ...updates };
        
        // Update all student copies
        const newHomeworkMap = { ...homeworkMap };
        Object.keys(newHomeworkMap).forEach(studentId => {
          newHomeworkMap[studentId] = newHomeworkMap[studentId].map(hw => 
            hw.id === assignmentId ? { ...hw, ...updates } : hw
          );
        });
        
        set({ 
          teacherAssignments: { ...teacherAssignments, [assignmentId]: updatedMaster },
          homeworkMap: newHomeworkMap
        });
      },

      updateHomeworkStatus: (studentId, homeworkId, status) => {
        const { homeworkMap } = get();
        const studentHw = homeworkMap[studentId];
        if (!studentHw) return;
        
        const newHw = studentHw.map(h => 
          h.id === homeworkId ? { ...h, status } : h
        );
        
        set({ homeworkMap: { ...homeworkMap, [studentId]: newHw } });
      },

      gradeHomework: (studentId, homeworkId, grade) => {
        const { homeworkMap } = get();
        const studentHw = homeworkMap[studentId];
        if (!studentHw) return;
        
        const newHw = studentHw.map(h => 
          h.id === homeworkId ? { ...h, status: "graded" as const, grade } : h
        );
        
        set({ homeworkMap: { ...homeworkMap, [studentId]: newHw } });
      },
}));
