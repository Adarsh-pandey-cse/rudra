// ─── AI Homework Generator Types ───────────────────────────────
import type { HomeworkDifficulty, EvaluationMethod, HomeworkType } from "./index";
import type { AuditEntry, ReviewHistoryEntry } from "@/lib/homeworkLifecycle";

export type PublishMode = "immediate" | "scheduled" | "draft";
export type AssignmentStatus = "draft" | "published" | "scheduled" | "archived";
export type SubmissionStatus = "assigned" | "viewed" | "started" | "not_started" | "draft" | "submitted" | "resubmitted" | "under_review" | "ai_evaluating" | "ai_evaluated" | "teacher_reviewed" | "accepted" | "rejected" | "resubmission_requested" | "late" | "archived";
export type BloomLevel = "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create";
export type QuestionType = "mcq" | "very_short" | "short" | "long" | "hots" | "competency" | "application" | "diagram";

// ─── Attachment ────────────────────────────────────────────────
export interface Attachment {
  id: string;
  name: string;
  type: "image" | "pdf" | "docx" | "video" | "voice" | "link";
  url: string;           // data URL or blob URL for local, real URL for remote
  size?: number;         // bytes
  mimeType?: string;
  uploadedAt: string;
}

// ─── Generated Question ────────────────────────────────────────
export interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];           // MCQ only (4 options)
  correctAnswer: string;
  solution: string;             // step-by-step
  marks: number;
  bloomLevel: BloomLevel;
  expectedTimeMinutes: number;
  conceptsCovered: string[];
  isEdited: boolean;            // teacher modified?
}

// ─── Answer Key Item ───────────────────────────────────────────
export interface AnswerKeyItem {
  questionId: string;
  answer: string;
  markingScheme: string;        // e.g., "1 mark for formula, 2 marks for calculation"
  stepByStepSolution: string;
}

// ─── Assignment (Master Record) ────────────────────────────────
export interface Assignment {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  instructions: string;
  
  // Academic
  subjectId: string;
  topicId: string;              // links to CBSE_CURRICULUM
  topicTitle: string;           // denormalized for display
  classId: string;
  
  // Content
  difficulty: HomeworkDifficulty;
  type: HomeworkType;
  maxMarks: number;
  questions: GeneratedQuestion[];
  answerKey: AnswerKeyItem[];
  attachments: Attachment[];
  rubric: string;
  
  // Scheduling
  dueDate: string;
  dueTime: string;
  isExtended?: boolean;
  originalDueDate?: string;
  publishMode: PublishMode;
  scheduledDate?: string;
  
  // Rules
  allowLateSubmission: boolean;
  lateWindowHours: number;
  allowResubmission: boolean;
  requiresTeacherApproval: boolean;
  evaluationMethod: EvaluationMethod;
  aiSettings: {
    ocr: boolean;
    handwriting: boolean;
    conceptDetection: boolean;
    grammarCheck: boolean;
    diagramCheck: boolean;
    formulaCheck: boolean;
    similarityDetection: boolean;
    aiFeedback: boolean;
  };
  
  // Recipients
  recipientStudentIds: string[];
  
  // Meta
  createdAt: string;
  updatedAt: string;
  status: AssignmentStatus;
}

// ─── Question Result (per-question AI eval) ────────────────────
export interface QuestionResult {
  questionId: string;
  studentAnswer: string;
  isCorrect: boolean;
  marksAwarded: number;
  marksTotal: number;
  feedback: string;
}

// ─── AI Evaluation ─────────────────────────────────────────────
export interface AiEvaluation {
  suggestedMarks: number;
  maxMarks: number;
  percentage: number;
  overallFeedback: string;
  studentFeedback: string;      // student-friendly summary
  weakTopics: string[];
  strongTopics: string[];
  conceptMastery: Record<string, number>; // topicId → 0-100
  questionResults: QuestionResult[];
  evaluatedAt: string;
}

// ─── Submission Version ──────────────────────────────────────────
export interface SubmissionVersion {
  id: string;
  versionNumber: number;
  submittedAt: string;
  textResponse: string;
  attachments: Attachment[];
  aiEvaluation: AiEvaluation | null;
  teacherGrade: number | null;
  teacherFeedback: string;
  status: "accepted" | "rejected" | "resubmission_requested" | "teacher_reviewed" | "submitted";
}

// ─── Student Submission ────────────────────────────────────────
export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  
  // Content (Current Version)
  textResponse: string;
  attachments: Attachment[];
  
  // Versioning
  currentVersion: number;
  versions: SubmissionVersion[];
  
  // Status
  status: SubmissionStatus;
  submittedAt: string | null;
  isLate: boolean;
  
  // AI Evaluation (Current Version)
  aiEvaluation: AiEvaluation | null;
  
  // Teacher Review (Current Version)
  teacherGrade: number | null;
  teacherFeedback: string;
  teacherReviewedAt: string | null;
  
  // Lifecycle
  teacherId: string;              // assigned teacher
  maxMarks: number;               // denormalized from assignment
  evaluatedBy: string;            // teacher who graded
  reviewHistory: ReviewHistoryEntry[];
  auditLog: AuditEntry[];

  // Meta
  createdAt: string;
  updatedAt: string;
}

// ─── Topic Search Result ───────────────────────────────────────
export interface TopicSearchResult {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  unit: string;
  board: string;
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedTime: number;
  learningOutcomes: string[];
  // Display-friendly aliases
  topicName: string;
  subjectName: string;
  chapterName: string;
  class: string;
}

// ─── Question Generation Config ────────────────────────────────
export interface QuestionGenConfig {
  topicId: string;
  topicTitle: string;
  subject: string;
  difficulty: HomeworkDifficulty;
  distribution: {
    mcq: number;
    very_short: number;
    short: number;
    long: number;
    hots: number;
    competency: number;
    application: number;
    diagram: number;
  };
}

export const DEFAULT_QUESTION_DISTRIBUTION: QuestionGenConfig["distribution"] = {
  mcq: 5,
  very_short: 2,
  short: 2,
  long: 1,
  hots: 1,
  competency: 1,
  application: 1,
  diagram: 1,
};

// ─── V2: MCQ Answers ───────────────────────────────────────────
export interface MCQAnswer {
  questionId: string;
  selectedOption: string;
}

// ─── V2: Leaderboard ───────────────────────────────────────────
export interface LeaderboardEntry {
  studentId: string;
  name: string;
  avatar?: string;
  class?: string;
  points: number;
  homeworkCount: number;
  accuracy: number;
  streak: number;
  rank: number;
}

export interface Leaderboard {
  id: string; // e.g. "class-10_math_weekly"
  entries: LeaderboardEntry[];
  updatedAt: string;
}

// ─── V2: Points Transaction ────────────────────────────────────
export interface PointTransaction {
  id: string;
  type: "homework_submit" | "perfect_score" | "high_score" | "streak_7" | "streak_30" | "first_submit" | "teacher_bonus" | "late_penalty";
  points: number;
  reason: string;
  assignmentId?: string;
  createdAt: string;
}
