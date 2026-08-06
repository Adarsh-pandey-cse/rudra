"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Flame, AlertTriangle, Trophy } from "lucide-react";
import type { Student, StudentProgress } from "@/types";
import { getMasteryColor, getMasteryLevel } from "@/types";
import GlassCard from "@/components/ui/GlassCard";

interface Props {
  student: Student;
  progress: StudentProgress;
  isPastStudent?: boolean;
}

export default function StudentProgressCard({ student, progress, isPastStudent }: Props) {
  const [expanded, setExpanded] = useState(false);

  const overallColor = getMasteryColor(getMasteryLevel(progress.overallScore));
  
  const borderClass = isPastStudent ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : '';
  const textClass = isPastStudent ? 'text-red-400' : 'text-white';
  const gradeClass = isPastStudent ? 'text-red-400/70' : 'text-white/50';

  return (
    <GlassCard hoverEffect className={`cursor-pointer overflow-hidden p-0 ${borderClass}`} onClick={() => setExpanded(!expanded)}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border shrink-0 ${isPastStudent ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-white/10 text-white'}`}>
              <span className="text-xl font-bold">
                {student.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className={`font-bold text-lg leading-tight ${textClass}`}>{student.name} {isPastStudent && '(Past Student)'}</h3>
              <p className={`text-sm ${gradeClass}`}>{student.grade} Grade</p>
            </div>
          </div>
          
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                className="text-white/10"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                style={{ stroke: overallColor, strokeDasharray: `${progress.overallScore}, 100` }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{progress.overallScore}%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {progress.studyStreak > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium">
              <Flame className="w-3.5 h-3.5" />
              <span>{progress.studyStreak} Day Streak</span>
            </div>
          )}
          
          {progress.weakTopics.slice(0, 2).map((topic, i) => (
            <div key={`weak-${i}`} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px]">{topic}</span>
            </div>
          ))}
          
          {progress.strongTopics.slice(0, 1).map((topic, i) => (
            <div key={`strong-${i}`} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Trophy className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px]">{topic}</span>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/50 mb-1">
            <span>Homework</span>
            <span>{progress.homeworkCompleted}/{progress.homeworkTotal}</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${(progress.homeworkCompleted / progress.homeworkTotal) * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-center text-white/30 hover:text-white/60 transition-colors">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring" as const, bounce: 0, duration: 0.4 }}
            className="border-t border-white/5 bg-black/20"
          >
            <div className="p-5 space-y-4">
              <h4 className="text-sm font-medium text-white/70">Topic Breakdown</h4>
              <div className="space-y-3">
                {progress.topicProgress.map((topic) => (
                  <div key={topic.topicId} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">{topic.topicName}</p>
                      <p className="text-xs text-white/50 capitalize">{topic.masteryLevel}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${topic.masteryScore}%`,
                            backgroundColor: getMasteryColor(topic.masteryLevel)
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-white/70 w-8 text-right">
                        {topic.masteryScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
