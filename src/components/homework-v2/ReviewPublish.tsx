"use client";

import { motion } from "framer-motion";
import { Send, FileText, Calendar, Users, Target, BookOpen, BrainCircuit, Activity, Clock } from "lucide-react";
import type { CurriculumTopic } from "./CurriculumSearch";
import type { AssignmentDetailsState } from "./AssignmentDetails";
import { useAuthStore } from "@/store/authStore";
import type { Student } from "@/types";

interface ReviewPublishProps {
  classId: string | null;
  studentIds: string[];
  subjectId: string | null;
  topic: CurriculumTopic | null;
  details: AssignmentDetailsState;
}

export default function ReviewPublish({ classId, studentIds, subjectId, topic, details }: ReviewPublishProps) {
  const { getAllUsers } = useAuthStore();
  const allStudents = getAllUsers().filter((u): u is Student => u.role === "student");
  
  const formattedClass = classId?.replace("class-", "Class ").toUpperCase();
  const activeAiCount = Object.values(details.aiSettings).filter(Boolean).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Final Review</h2>
          <p className="text-white/50 text-sm">Verify all details before publishing to students.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Key Details */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="p-6 bg-black/40 border border-white/10 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{details.title}</h3>
                <p className="text-blue-400 text-sm font-medium">{details.type}</p>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              {details.description && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm text-white/70 italic">"{details.description}"</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 text-white/50 mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">Difficulty</span>
                  </div>
                  <p className="text-white font-medium">{details.difficulty}</p>
                </div>
                
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 text-white/50 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">Est. Time</span>
                  </div>
                  <p className="text-white font-medium">{details.estimatedTimeMin} mins</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-black/40 border border-white/10 rounded-2xl">
            <h4 className="text-white font-bold flex items-center gap-2 mb-4">
              <BrainCircuit className="w-5 h-5 text-purple-400" />
              AI Pipeline Configuration
            </h4>
            
            <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-4">
              <div>
                <p className="text-purple-300 font-medium text-sm">Evaluation Mode</p>
                <p className="text-white font-bold">{details.evaluationMethod}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold">
                {activeAiCount}
              </div>
            </div>
            
            {details.evaluationMethod !== "Teacher Only" && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(details.aiSettings).map(([key, enabled]) => enabled && (
                  <span key={key} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/70">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Targets & Meta */}
        <div className="col-span-1 space-y-6">
          <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
            <h4 className="text-white font-bold flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-400" />
              Recipients
            </h4>
            <div className="mb-4">
              <p className="text-xs text-white/50 uppercase font-semibold">Target Class</p>
              <p className="text-emerald-400 font-bold text-lg">{formattedClass}</p>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase font-semibold mb-2">Students ({studentIds.length})</p>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-2">
                {studentIds.map(id => {
                  const s = allStudents.find(stu => stu.id === id);
                  return (
                    <span key={id} className="px-2 py-1 bg-white/10 rounded text-xs text-white/80 whitespace-nowrap">
                      {s?.name || id}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
            <h4 className="text-white font-bold flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-amber-400" />
              Deadlines
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/50 uppercase font-semibold">Due Date</p>
                <p className="text-white font-medium">{new Date(details.dueDate).toLocaleDateString()} at {details.dueTime}</p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-white/50 uppercase font-semibold">Late Policy</p>
                {details.allowLate ? (
                  <p className="text-amber-400 font-medium text-sm mt-1">Allowed (Up to {details.lateWindowHours}h late)</p>
                ) : (
                  <p className="text-rose-400 font-medium text-sm mt-1">Strict Deadline (No Late Auth)</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
            <h4 className="text-white font-bold flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Curriculum Binding
            </h4>
            <p className="text-sm font-medium text-white line-clamp-2">{topic?.title || "Custom Topic"}</p>
            {topic && (
              <p className="text-xs text-white/50 mt-1">{topic.chapter}</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
