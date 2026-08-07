import { SubmissionStatus } from '@/types/homework-types';

export interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  performedAt: string;
  previousStatus: string;
  newStatus: string;
  metadata?: Record<string, any>;
}

export interface ReviewHistoryEntry {
  id: string;
  version: number;
  status: string;
  marks: number | null;
  maxMarks: number;
  feedback: string;
  reviewedBy: string;
  reviewedAt: string;
}

const VALID_TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  'assigned': ['viewed', 'started', 'submitted'],
  'viewed': ['started', 'submitted'],
  'started': ['submitted', 'draft'],
  'not_started': ['assigned', 'viewed', 'started', 'draft'],
  'draft': ['submitted', 'started'],
  'submitted': ['under_review', 'ai_evaluating', 'accepted', 'rejected', 'resubmission_requested'],
  'ai_evaluating': ['ai_evaluated'],
  'ai_evaluated': ['accepted', 'rejected', 'resubmission_requested', 'teacher_reviewed'],
  'teacher_reviewed': ['accepted', 'rejected', 'resubmission_requested'],
  'under_review': ['accepted', 'rejected', 'resubmission_requested'],
  'accepted': ['archived'],
  'rejected': ['started', 'submitted'],
  'resubmission_requested': ['started', 'submitted'],
  'resubmitted': ['under_review', 'ai_evaluating', 'accepted', 'rejected'],
  'late': ['submitted'],
  'archived': [],
};

export function canTransition(from: SubmissionStatus, to: SubmissionStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function validateTransition(from: SubmissionStatus, to: SubmissionStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid transition from ${from} to ${to}`);
  }
}

export function createAuditEntry(
  action: string,
  performedBy: string,
  previousStatus: string,
  newStatus: string,
  metadata?: Record<string, any>
): AuditEntry {
  return {
    id: crypto.randomUUID(),
    action,
    performedBy,
    performedAt: new Date().toISOString(),
    previousStatus,
    newStatus,
    metadata,
  };
}

export function validateGrade(grade: number, maxMarks: number): { valid: boolean; error?: string } {
  if (grade < 0) {
    return { valid: false, error: 'Grade cannot be negative.' };
  }
  if (grade > maxMarks) {
    return { valid: false, error: `Grade cannot exceed max marks (${maxMarks}).` };
  }
  return { valid: true };
}

export function validateFeedback(feedback: string, status: SubmissionStatus): { valid: boolean; error?: string } {
  // Feedback is now fully optional per user request
  return { valid: true };
}

export function getStatusColor(status: SubmissionStatus): string {
  switch (status) {
    case 'accepted':
      return '#10B981'; // Emerald 500
    case 'rejected':
      return '#EF4444'; // Red 500
    case 'resubmission_requested':
      return '#F59E0B'; // Amber 500
    case 'submitted':
    case 'under_review':
      return '#3B82F6'; // Blue 500
    case 'ai_evaluating':
    case 'ai_evaluated':
      return '#8B5CF6'; // Violet 500
    case 'started':
    case 'draft':
      return '#F97316'; // Orange 500
    case 'viewed':
      return '#6B7280'; // Gray 500
    case 'assigned':
    default:
      return '#9CA3AF'; // Gray 400
  }
}

export function getStatusLabel(status: SubmissionStatus): string {
  switch (status) {
    case 'assigned': return 'Assigned';
    case 'viewed': return 'Viewed';
    case 'started': return 'Started';
    case 'draft': return 'Draft';
    case 'submitted': return 'Submitted';
    case 'ai_evaluating': return 'Evaluating (AI)';
    case 'ai_evaluated': return 'Evaluated (AI)';
    case 'under_review': return 'Under Review';
    case 'accepted': return 'Accepted';
    case 'rejected': return 'Rejected';
    case 'resubmission_requested': return 'Resubmission Requested';
    default: return status;
  }
}

export function getStatusVariant(status: SubmissionStatus): 'success' | 'error' | 'warning' | 'info' | 'default' {
  switch (status) {
    case 'accepted':
      return 'success';
    case 'rejected':
      return 'error';
    case 'resubmission_requested':
      return 'warning';
    case 'submitted':
    case 'under_review':
    case 'ai_evaluating':
    case 'ai_evaluated':
      return 'info';
    case 'started':
    case 'draft':
    case 'viewed':
    case 'assigned':
    default:
      return 'default';
  }
}
