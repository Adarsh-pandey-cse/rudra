// ─── Doubt Hub Types ───────────────────────────────────────────
import type { Attachment } from "./homework-types";

export type DoubtStatus = "open" | "ai_answered" | "escalated" | "teacher_answered" | "resolved" | "reopened";
export type DoubtPriority = "low" | "medium" | "high" | "urgent";
export type DoubtReplyAuthorRole = "ai" | "teacher" | "student";

// ─── Doubt ─────────────────────────────────────────────────────
export interface Doubt {
  id: string;
  studentId: string;
  studentName: string;
  
  // Academic Context
  subjectId: string;
  subjectName: string;
  topicId?: string;
  topicName?: string;
  classId?: string;
  
  // Content
  question: string;
  attachments: Attachment[];
  
  // Status
  status: DoubtStatus;
  priority: DoubtPriority;
  
  // AI
  aiResponse: string | null;
  needsTeacher: boolean;
  
  // Resolution
  resolvedAt: string | null;
  resolvedBy?: string;           // userId
  studentRating: number | null;  // 1-5
  studentFeedback?: string;
  
  // Meta
  createdAt: string;
  updatedAt: string;
}

// ─── Doubt Reply ───────────────────────────────────────────────
export interface DoubtReply {
  id: string;
  doubtId: string;
  authorId: string;
  authorName: string;
  authorRole: DoubtReplyAuthorRole;
  
  // Content
  content: string;
  attachments: Attachment[];
  
  // Meta
  createdAt: string;
}

// ─── Doubt Stats (for teacher dashboard) ───────────────────────
export interface DoubtStats {
  totalDoubts: number;
  pendingDoubts: number;
  resolvedToday: number;
  avgResponseTime: string;      // "12 min" or "2 hr"
  topSubjects: { subjectId: string; subjectName: string; count: number }[];
}

// ─── Knowledge Base Entry ──────────────────────────────────────
export interface KnowledgeBaseEntry {
  doubtId: string;
  question: string;
  answer: string;               // best answer (teacher or AI)
  subjectId: string;
  topicId?: string;
  tags: string[];
  useCount: number;             // how many times reused
  createdAt: string;
}
