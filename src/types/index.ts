// ─── User & Auth ───────────────────────────────────────────────
export type UserRole = "teacher" | "student";

export interface User {
  id: string;
  username: string;
  email?: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  password?: string;
  fcmToken?: string;
  pin?: string;
}

export interface Teacher extends User {
  role: "teacher";
  subject: string;
  classesManaged: string[];
}

export interface Student extends User {
  role: "student";
  classId: string;
  addedByTeacherId: string;
  grade: string;
  parentName?: string;
  parentPhone?: string;
  fatherName?: string;
  status?: "active" | "archived" | "deleted";
  leaveDate?: string;
}

// ─── Academic ──────────────────────────────────────────────────
export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  order: number;
  topicCount: number;
}

export type MasteryLevel = "weak" | "learning" | "practicing" | "mastered";

export interface TopicProgress {
  topicId: string;
  topicName: string;
  chapterId: string;
  subjectId: string;
  masteryScore: number; // 0–100
  masteryLevel: MasteryLevel;
  lastPracticed: string | null;
  mistakeCount: number;
}

export interface StudentProgress {
  studentId: string;
  overallScore: number; // 0–100
  studyStreak: number;
  studyHoursToday: number;
  homeworkCompleted: number;
  homeworkTotal: number;
  topicProgress: TopicProgress[];
  weakTopics: string[];
  strongTopics: string[];
}

// ─── Homework V2 ───────────────────────────────────────────────
export type HomeworkStatus = "pending" | "submitted" | "graded" | "draft" | "scheduled";
export type HomeworkType = "Practice Questions" | "Worksheet" | "Project" | "Activity" | "Lab Work" | "Reading" | "Writing" | "Drawing" | "Revision" | "MCQ" | "Numerical" | "AI Generated Worksheet" | "Mixed";
export type EvaluationMethod = "Teacher Only" | "Teacher + AI" | "AI Suggestion + Teacher Final";
export type HomeworkDifficulty = "Easy" | "Medium" | "Hard" | "Adaptive";
export type Visibility = "Immediate" | "Scheduled" | "Draft";

export interface AiSettings {
  ocr: boolean;
  handwriting: boolean;
  conceptDetection: boolean;
  grammarCheck: boolean;
  diagramCheck: boolean;
  formulaCheck: boolean;
  similarityDetection: boolean;
  aiFeedback: boolean;
}

export interface Homework {
  id: string;
  title: string;
  subjectId: string;
  
  type: HomeworkType;
  difficulty: HomeworkDifficulty;
  
  description?: string;
  learningObjectives?: string;
  
  assignedBy: string;
  assignedDate: string;
  dueDate: string;
  dueTime?: string;
  
  allowLateSubmission: boolean;
  lateSubmissionWindow?: number;
  
  maxGrade: number;
  passingMarks?: number;
  grade?: number;
  estimatedTime?: number;
  
  evaluationMethod: EvaluationMethod;
  visibility: Visibility;
  
  aiSettings?: AiSettings;
  targetClassId?: string;
  topicId?: string;

  status: HomeworkStatus;
}

// ─── Dashboard Stats ───────────────────────────────────────────
export interface TeacherStats {
  totalStudents: number;
  activeToday: number;
  homeworkPending: number;
  avgClassScore: number;
  syllabusProgress: number;
  studentsAtRisk: number;
}

export interface StudentStats {
  masteryScore: number;
  studyStreak: number;
  homeworkPending: number;
  revisionDue: number;
  examCountdown: number;
  studyHoursToday: number;
}

// ─── Utility ───────────────────────────────────────────────────
export function getMasteryLevel(score: number): MasteryLevel {
  if (score >= 80) return "mastered";
  if (score >= 55) return "practicing";
  if (score >= 30) return "learning";
  return "weak";
}

export function getMasteryColor(level: MasteryLevel): string {
  switch (level) {
    case "mastered": return "#10B981";
    case "practicing": return "#2563EB";
    case "learning": return "#F59E0B";
    case "weak": return "#EF4444";
  }
}
