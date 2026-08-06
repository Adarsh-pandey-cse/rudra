"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUploadStore, UploadTask } from "@/store/uploadStore";
import { X, File, Image as ImageIcon, CheckCircle2, AlertCircle, ChevronUp, ChevronDown, PauseCircle, PlayCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/utils";

export const UploadManager = () => {
  const tasksMap = useUploadStore(state => state.tasks);
  const clearCompleted = useUploadStore(state => state.clearCompleted);
  const [isExpanded, setIsExpanded] = useState(true);

  const tasks = Object.values(tasksMap);

  const uploadingTasks = tasks.filter(t => ["preparing", "compressing", "uploading", "processing", "saving"].includes(t.status));
  const activeTaskCount = uploadingTasks.length;
  const hasFailedTasks = tasks.some(t => t.status === "failed" || t.status === "cancelled");

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (tasks.length > 0 && activeTaskCount === 0 && !hasFailedTasks) {
      timeout = setTimeout(() => {
        clearCompleted();
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [tasks.length, activeTaskCount, hasFailedTasks, clearCompleted]);

  if (tasks.length === 0) return null;

  const totalProgress = activeTaskCount > 0 
    ? uploadingTasks.reduce((acc, task) => acc + task.progress, 0) / activeTaskCount 
    : 100;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === Infinity || seconds < 0) return "calculating...";
    if (seconds < 60) return `${Math.round(seconds)}s left`;
    return `${Math.round(seconds / 60)}m left`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-[#0B1527] border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col backdrop-blur-xl"
      >
        {/* Header */}
        <div 
          className="p-4 border-b border-white/[0.08] flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div>
            <h3 className="text-white font-medium text-sm">
              {activeTaskCount > 0 ? `Uploading ${activeTaskCount} files...` : "Uploads complete"}
            </h3>
            {activeTaskCount > 0 && (
              <div className="w-48 h-1.5 bg-white/[0.06] rounded-full mt-2 overflow-hidden">
                <motion.div 
                  className="h-full bg-[#5B5CFF]"
                  animate={{ width: `${totalProgress}%` }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeTaskCount === 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); clearCompleted(); }}
                className="text-xs text-[#7B8798] hover:text-white transition-colors px-2 py-1"
              >
                Clear
              </button>
            )}
            <button className="text-[#7B8798] hover:text-white transition-colors">
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Expanded List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "auto", maxHeight: "300px" }}
              exit={{ height: 0 }}
              className="overflow-y-auto custom-scrollbar"
            >
              <div className="p-2 space-y-1">
                {tasks.map(task => (
                  <div key={task.id} className="p-2 rounded-xl hover:bg-white/[0.02] transition-colors flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden relative">
                      {task.file.type.startsWith("image/") ? (
                        <ImageIcon className="w-4 h-4 text-[#7B8798]" />
                      ) : (
                        <File className="w-4 h-4 text-[#7B8798]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm text-white font-medium truncate pr-2">{task.name}</p>
                        <span className="text-[10px] text-[#7B8798] capitalize shrink-0">
                          {task.status}
                        </span>
                      </div>
                      
                      {/* Progress Bar for Active Uploads */}
                      {["preparing", "compressing", "uploading", "processing"].includes(task.status) && (
                        <div className="w-full h-1 bg-white/[0.06] rounded-full mt-1.5 overflow-hidden">
                          <motion.div 
                            className="h-full bg-[#5B5CFF]"
                            animate={{ width: `${task.progress || 0}%` }}
                            transition={{ ease: "linear", duration: 0.2 }}
                          />
                        </div>
                      )}

                      {/* Stats row */}
                      {task.status === "uploading" && (
                        <div className="flex items-center justify-between mt-1 text-[10px] text-[#7B8798]">
                          <div className="flex gap-2">
                            <span>{Math.round(task.progress || 0)}%</span>
                            <span>•</span>
                            <span>{formatBytes(task.speed)}/s</span>
                          </div>
                          <span>{formatTime(task.remainingTime)}</span>
                        </div>
                      )}
                      
                      {/* Error State */}
                      {task.status === "failed" || task.status === "cancelled" ? (
                        <p className="text-[10px] text-[#EF4444] mt-1 truncate">{task.error}</p>
                      ) : null}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 pl-2">
                      {["preparing", "compressing", "uploading", "processing"].includes(task.status) && (
                        <button 
                          onClick={() => useUploadStore.getState().cancelUpload(task.id)}
                          className="p-1.5 hover:bg-white/[0.1] rounded text-[#7B8798] hover:text-[#EF4444] transition-colors"
                          title="Cancel Upload"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {task.status === "completed" && <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />}
                      {(task.status === "failed" || task.status === "cancelled") && <AlertCircle className="w-5 h-5 text-[#EF4444]" />}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
