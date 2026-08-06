import { create } from "zustand";

export type UploadStatus = 
  | "idle" 
  | "preparing" 
  | "compressing" 
  | "uploading" 
  | "processing" 
  | "saving" 
  | "completed" 
  | "failed" 
  | "cancelled" 
  | "retrying";

export interface UploadTask {
  id: string;
  file?: File;
  path: string;
  name: string;
  size: number;
  status: UploadStatus;
  
  // Metrics
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  speed: number; // bytes per second
  remainingTime: number; // seconds
  
  downloadURL?: string;
  error?: string;
  
  entityType?: "homework" | "doubt" | "profile" | "notice" | string;
  entityId?: string;
  
  // AbortController for cancellation
  abortController?: AbortController;
  // Firebase UploadTask reference for pause/resume/cancel
  uploadRef?: any; 
}

interface UploadStore {
  tasks: Record<string, UploadTask>;
  addTask: (task: UploadTask) => void;
  updateTaskProgress: (id: string, updates: Partial<UploadTask>) => void;
  setTaskStatus: (id: string, status: UploadStatus, extra?: Partial<UploadTask>) => void;
  removeTask: (id: string) => void;
  clearCompleted: () => void;
  getTasksByEntity: (entityType: string, entityId: string) => UploadTask[];
  cancelUpload: (id: string) => void;
}

export const useUploadStore = create<UploadStore>((set, get) => ({
  tasks: {},
  
  addTask: (task) => set((state) => ({
    tasks: { ...state.tasks, [task.id]: task }
  })),

  updateTaskProgress: (id, updates) => set((state) => {
    if (!state.tasks[id]) return state;
    return {
      tasks: {
        ...state.tasks,
        [id]: { ...state.tasks[id], ...updates }
      }
    };
  }),

  setTaskStatus: (id, status, extra = {}) => set((state) => {
    if (!state.tasks[id]) return state;
    
    // Set 100% if completed
    let progress = state.tasks[id].progress;
    if (status === "completed") progress = 100;
    else if (status === "idle" || status === "preparing" || status === "retrying") progress = 0;

    return {
      tasks: {
        ...state.tasks,
        [id]: { ...state.tasks[id], status, progress, ...extra }
      }
    };
  }),

  removeTask: (id) => set((state) => {
    const newTasks = { ...state.tasks };
    delete newTasks[id];
    return { tasks: newTasks };
  }),

  clearCompleted: () => set((state) => {
    const newTasks = { ...state.tasks };
    Object.keys(newTasks).forEach(id => {
      const status = newTasks[id].status;
      if (status === "completed" || status === "failed" || status === "cancelled") {
        delete newTasks[id];
      }
    });
    return { tasks: newTasks };
  }),

  getTasksByEntity: (entityType, entityId) => {
    const { tasks } = get();
    return Object.values(tasks).filter(t => t.entityType === entityType && t.entityId === entityId);
  },

  cancelUpload: (id) => {
    const task = get().tasks[id];
    if (task) {
      import('@/lib/services/upload.service').then(({ cancelUploadById }) => {
        cancelUploadById(id);
      }).catch(err => console.error("Failed to cancel upload:", err));
    }
  }
}));
