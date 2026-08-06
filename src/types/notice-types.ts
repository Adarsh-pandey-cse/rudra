// ─── Smart Notice Board Types ──────────────────────────────────
import type { Attachment } from "./homework-types";

export type NoticeType =
  | "general"
  | "homework"
  | "holiday"
  | "class_cancelled"
  | "class_delayed"
  | "extra_class"
  | "fee_reminder"
  | "exam"
  | "quiz"
  | "result"
  | "emergency"
  | "important"
  | "birthday"
  | "achievement"
  | "documents"
  | "announcement";

export type NoticePriority = "low" | "medium" | "high" | "critical";
export type NoticeTarget = "all" | "class" | "section" | "batch" | "selected";
export type NoticePublishMode = "immediate" | "scheduled" | "recurring";
export type NoticeStatus = "draft" | "published" | "expired" | "archived";

// ─── Notice ────────────────────────────────────────────────────
export interface Notice {
  id: string;
  teacherId: string;
  teacherName: string;
  
  // Content
  title: string;
  body: string;
  shortBody: string;         // push notification version
  type: NoticeType;
  priority: NoticePriority;
  
  // Targeting
  target: NoticeTarget;
  targetClassId?: string;
  targetStudentIds?: string[];
  
  // Attachments
  attachments: Attachment[];
  
  // Scheduling
  publishMode: NoticePublishMode;
  scheduledDate?: string;
  recurringCron?: string;
  
  // Display
  isPinned: boolean;
  
  // Meta
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  status: NoticeStatus;
}

// ─── Notice Read Receipt ───────────────────────────────────────
export interface NoticeRead {
  noticeId: string;
  studentId: string;
  readAt: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

// ─── Notice Analytics ──────────────────────────────────────────
export interface NoticeAnalytics {
  noticeId: string;
  totalRecipients: number;
  viewedCount: number;
  unreadCount: number;
  acknowledgedCount: number;
  ignoredCount: number;
}

// ─── Notice Type Metadata (for UI) ─────────────────────────────
export interface NoticeTypeInfo {
  type: NoticeType;
  label: string;
  icon: string;       // Lucide icon name
  color: string;       // hex
  bgColor: string;     // hex with alpha
}

export const NOTICE_TYPE_INFO: NoticeTypeInfo[] = [
  { type: "general",         label: "General",         icon: "Info",            color: "#6366F1", bgColor: "rgba(99,102,241,0.15)" },
  { type: "homework",        label: "Homework",        icon: "BookOpen",        color: "#3B82F6", bgColor: "rgba(59,130,246,0.15)" },
  { type: "holiday",         label: "Holiday",         icon: "Palmtree",        color: "#10B981", bgColor: "rgba(16,185,129,0.15)" },
  { type: "class_cancelled", label: "Class Cancelled", icon: "XCircle",         color: "#EF4444", bgColor: "rgba(239,68,68,0.15)" },
  { type: "class_delayed",   label: "Class Delayed",   icon: "Clock",           color: "#F59E0B", bgColor: "rgba(245,158,11,0.15)" },
  { type: "extra_class",     label: "Extra Class",     icon: "CalendarPlus",    color: "#8B5CF6", bgColor: "rgba(139,92,246,0.15)" },
  { type: "fee_reminder",    label: "Fee Reminder",    icon: "IndianRupee",     color: "#F97316", bgColor: "rgba(249,115,22,0.15)" },
  { type: "exam",            label: "Exam",            icon: "FileText",        color: "#DC2626", bgColor: "rgba(220,38,38,0.15)" },
  { type: "quiz",            label: "Quiz",            icon: "HelpCircle",      color: "#06B6D4", bgColor: "rgba(6,182,212,0.15)" },
  { type: "result",          label: "Result",          icon: "Award",           color: "#10B981", bgColor: "rgba(16,185,129,0.15)" },
  { type: "emergency",       label: "Emergency",       icon: "AlertTriangle",   color: "#EF4444", bgColor: "rgba(239,68,68,0.15)" },
  { type: "important",       label: "Important",       icon: "AlertCircle",     color: "#F59E0B", bgColor: "rgba(245,158,11,0.15)" },
  { type: "birthday",        label: "Birthday",        icon: "Cake",            color: "#EC4899", bgColor: "rgba(236,72,153,0.15)" },
  { type: "achievement",     label: "Achievement",     icon: "Trophy",          color: "#F59E0B", bgColor: "rgba(245,158,11,0.15)" },
  { type: "documents",       label: "Documents",       icon: "FileStack",       color: "#64748B", bgColor: "rgba(100,116,139,0.15)" },
  { type: "announcement",    label: "Announcement",    icon: "Megaphone",       color: "#6366F1", bgColor: "rgba(99,102,241,0.15)" },
];

// ─── Priority Metadata ─────────────────────────────────────────
export const NOTICE_PRIORITY_INFO = {
  low:      { label: "Low",      color: "#64748B", bgColor: "rgba(100,116,139,0.15)" },
  medium:   { label: "Medium",   color: "#3B82F6", bgColor: "rgba(59,130,246,0.15)" },
  high:     { label: "High",     color: "#F59E0B", bgColor: "rgba(245,158,11,0.15)" },
  critical: { label: "Critical", color: "#EF4444", bgColor: "rgba(239,68,68,0.15)" },
} as const;
