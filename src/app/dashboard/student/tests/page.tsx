"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useTestStore } from "@/store/testStore";
import { CLASSES, getSubjectsForClass } from "@/data/curriculum-index";
import { FileText, Trophy, Calendar, BookOpen } from "lucide-react";

export default function StudentTestsPage() {
  const { currentUser } = useAuthStore();
  const { testMarks } = useTestStore();

  const myMarks = currentUser ? testMarks.filter(m => m.studentId === currentUser.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  const getSubjectName = (classId: string, subjectId: string) => {
    const subs = getSubjectsForClass(classId);
    return subs.find(s => s.id === subjectId)?.name || "Unknown Subject";
  };
  
  const getSubjectIcon = (classId: string, subjectId: string) => {
    const subs = getSubjectsForClass(classId);
    return (subs.find(s => s.id === subjectId) as any)?.icon || <BookOpen className="w-5 h-5" />;
  };

  const totalXP = myMarks.reduce((acc, curr) => acc + curr.marks, 0);

  return (
    <DashboardLayout role="student">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B1527] p-6 md:p-8 rounded-3xl border border-white/[0.05]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#22C55E]/20 to-[#10B981]/20 rounded-2xl flex items-center justify-center border border-white/5">
              <FileText className="w-7 h-7 text-[#22C55E]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Test Marks</h1>
              <p className="text-[#7B8798] mt-1">Track your offline test scores and XP rewards.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/10">
            <div className="p-2 bg-[#F59E0B]/20 rounded-xl"><Trophy className="w-5 h-5 text-[#F59E0B]" /></div>
            <div>
              <p className="text-xs text-[#7B8798] font-medium">Total Test XP</p>
              <p className="text-lg font-bold text-white">+{totalXP}</p>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {myMarks.length === 0 ? (
            <div className="bg-[#0B1527] border border-white/10 rounded-3xl p-12 text-center">
              <FileText className="w-16 h-16 text-[#7B8798]/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Test Marks Yet</h3>
              <p className="text-[#7B8798]">Your teacher hasn't uploaded any offline test marks for you.</p>
            </div>
          ) : (
            myMarks.map((mark, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }}
                key={mark.id} 
                className="bg-[#0B1527] border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl">
                    {getSubjectIcon(mark.classId, mark.subjectId)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{getSubjectName(mark.classId, mark.subjectId)} Test</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-[#7B8798]">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(mark.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-start md:self-auto">
                  <div className="text-right">
                    <p className="text-xs font-medium text-[#7B8798] mb-1">Score</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">{mark.marks}</span>
                      <span className="text-[#7B8798] font-medium">/ {mark.maxMarks}</span>
                    </div>
                  </div>
                  
                  <div className="w-px h-10 bg-white/10"></div>
                  
                  <div className="text-right">
                    <p className="text-xs font-medium text-[#7B8798] mb-1">Reward</p>
                    <span className="inline-flex items-center gap-1 bg-[#F59E0B]/10 text-[#F59E0B] px-3 py-1 rounded-lg font-bold border border-[#F59E0B]/20">
                      +{mark.marks} XP
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}


