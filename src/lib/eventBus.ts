export type HomeworkEvent =
  | { type: 'HOMEWORK_ASSIGNED'; payload: { assignmentId: string; teacherId: string; studentIds: string[]; title: string; } }
  | { type: 'HOMEWORK_VIEWED'; payload: { assignmentId: string; studentId: string; } }
  | { type: 'HOMEWORK_STARTED'; payload: { assignmentId: string; studentId: string; } }
  | { type: 'HOMEWORK_SUBMITTED'; payload: { assignmentId: string; studentId: string; submissionId: string; version: number; isLate?: boolean; } }
  | { type: 'HOMEWORK_GRADED'; payload: { submissionId: string; assignmentId: string; studentId: string; teacherId: string; grade: number; maxMarks: number; feedback: string; title: string; isLate?: boolean; } }
  | { type: 'HOMEWORK_REJECTED'; payload: { submissionId: string; assignmentId: string; studentId: string; teacherId: string; reason: string; title: string; } }
  | { type: 'HOMEWORK_RESUBMISSION_REQUESTED'; payload: { submissionId: string; assignmentId: string; studentId: string; teacherId: string; remarks: string; title: string; } }
  | { type: 'HOMEWORK_DEADLINE_EXTENDED'; payload: { assignmentId: string; newDate: string; title: string; studentIds: string[]; } }
  | { type: 'LEADERBOARD_UPDATED'; payload: { studentId: string; points: number; newRank: number; previousRank: number; } }
  | { type: 'PROFILE_UPDATED'; payload: { studentId: string; field: string; value: any; } }
  | { type: 'STORE_SYNC'; payload: { storeName: string; state: any; } };

type EventHandler<T extends HomeworkEvent> = (event: T) => void;

class EventBus {
  private listeners: Map<HomeworkEvent['type'], Set<EventHandler<any>>> = new Map();

  constructor() {
    // We intentionally do NOT use BroadcastChannel here to sync events across tabs
    // because Firebase onSnapshot handles cross-tab UI syncing natively.
    // Broadcasting local events that trigger Firebase writes would cause duplicate 
    // database entries for the same action (e.g. 2 tabs open = 2 notifications created).
  }

  on<T extends HomeworkEvent['type']>(
    type: T,
    callback: EventHandler<Extract<HomeworkEvent, { type: T }>>
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const handlers = this.listeners.get(type)!;
    handlers.add(callback as EventHandler<any>);

    return () => {
      handlers.delete(callback as EventHandler<any>);
      if (handlers.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  emit(event: HomeworkEvent) {
    this.emitLocal(event);
  }

  private emitLocal(event: HomeworkEvent) {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      Array.from(handlers).forEach((handler) => handler(event));
    }
  }
}

export const eventBus = new EventBus();
