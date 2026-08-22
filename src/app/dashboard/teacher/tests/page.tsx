"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { CLASSES, getSubjectsForClass } from "@/data/curriculum-index";

import { useTestStore } from "@/store/testStore";
import { Folder, Users, FileText, CheckCircle2, ChevronRight, X, Trash2, ArrowLeft, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function TeacherTestsPage() {
  const { currentUser } = useAuthStore();
  const { getStudentUsers } = useAuthStore();
  const { testMarks, addTestMark, deleteTestMark } = useTestStore();

  const [viewState, setViewState] = useState<"classes" | "subjects" | "students">("classes");
  
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);

  const [marksInputs, setMarksInputs] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  const handleClassSelect = (cls: string) => {
    setSelectedClass(cls);
    setViewState("subjects");
  };

  const handleSubjectSelect = (subject: any) => {
    setSelectedSubject(subject);
    setViewState("students");
  };

  const handleBack = () => {
    if (viewState === "students") setViewState("subjects");
    else if (viewState === "subjects") setViewState("classes");
  };

  const students = getStudentUsers();
  const currentStudents = students.filter(s => (s as any).grade === selectedClass || (s as any).classId === `class-${selectedClass}` || (s as any).classId === selectedClass);
  const recentMarks = selectedClass ? testMarks.filter(m => m.classId === selectedClass).sort((a,b) => b.createdAt - a.createdAt).slice(0, 10) : [];

  const handleSaveMarks = async () => {
    if (!selectedClass || !selectedSubject || !currentUser) return;
    
    const studentIdsWithMarks = Object.keys(marksInputs).filter(id => marksInputs[id].trim() !== "");
    if (studentIdsWithMarks.length === 0) {
      toast.error("Please enter marks for at least one student");
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    const dateStr = new Date().toISOString().split('T')[0];

    for (const studentId of studentIdsWithMarks) {
      const marks = parseFloat(marksInputs[studentId]);
      if (isNaN(marks) || marks < 0 || marks > 20) {
        toast.error("Invalid marks for student. Must be 0-20.");
        continue;
      }
      
      try {
        await addTestMark({
          studentId,
          teacherId: currentUser.id,
          classId: selectedClass,
          subjectId: selectedSubject.id,
          date: dateStr,
          marks,
          maxMarks: 20
        });
        successCount++;
      } catch (err) {}
    }

    setIsSubmitting(false);
    if (successCount > 0) {
      setMarksInputs({});
      toast.success("Saved \ test marks successfully!");
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B1527] p-6 md:p-8 rounded-3xl border border-white/[0.05]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#5B5CFF]/20 to-[#8B5CF6]/20 rounded-2xl flex items-center justify-center border border-white/5">
              <FileText className="w-7 h-7 text-[#5B5CFF]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Offline Tests</h1>
              <p className="text-[#7B8798] mt-1">Enter manual test marks to boost student XP and rankings.</p>
            </div>
          </div>
          {viewState !== "classes" && (
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors border border-white/10 w-fit"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
        </div>

        {/* Dynamic Views */}
        <AnimatePresence mode="wait">
          {viewState === "classes" && (
            <motion.div 
              key="classes"
              variants={containerVariants} initial="hidden" animate="show" exit="hidden"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
            >
              {CLASSES.map(cls => (
                <motion.button
                  key={cls}
                  variants={itemVariants}
                  onClick={() => handleClassSelect(cls)}
                  className="group relative flex flex-col items-center justify-center gap-4 bg-[#0B1527] border border-white/10 p-8 rounded-3xl hover:bg-[#131D2E] transition-all hover:border-[#5B5CFF]/30 hover:shadow-xl hover:shadow-[#5B5CFF]/10 overflow-hidden"
                >
                  <div className="w-20 h-20 bg-[#1A2333] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <Folder className="w-10 h-10 text-[#5B5CFF]" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-[#5B5CFF] transition-colors">Class {cls}</h3>
                </motion.button>
              ))}
            </motion.div>
          )}

          {viewState === "subjects" && selectedClass && (
            <motion.div 
              key="subjects"
              variants={containerVariants} initial="hidden" animate="show" exit="hidden"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              {getSubjectsForClass(selectedClass).map(sub => (
                <motion.button
                  key={sub.id}
                  variants={itemVariants}
                  onClick={() => handleSubjectSelect(sub)}
                  className="group flex items-center justify-between bg-[#0B1527] border border-white/10 p-6 rounded-2xl hover:bg-[#131D2E] transition-all hover:border-[#5B5CFF]/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl">
                      { (sub as any).icon || <FileText className="w-6 h-6 text-white/50" /> }
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-white group-hover:text-[#5B5CFF] transition-colors">{sub.name}</h3>
                      <p className="text-sm text-[#7B8798]">Class {selectedClass}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#7B8798] group-hover:text-[#5B5CFF] group-hover:translate-x-1 transition-all" />
                </motion.button>
              ))}
            </motion.div>
          )}

          {viewState === "students" && selectedClass && selectedSubject && (
            <motion.div key="students" variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="space-y-6">
              <div className="bg-[#0B1527] border border-white/10 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Enter Marks for {selectedSubject.name}</h2>
                    <p className="text-[#7B8798] text-sm mt-1">Class {selectedClass} • Maximum marks: 20</p>
                  </div>
                  <button
                    onClick={handleSaveMarks}
                    disabled={isSubmitting}
                    className="bg-[#5B5CFF] hover:bg-[#5B5CFF]/90 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Marks"}
                  </button>
                </div>

                <div className="divide-y divide-white/5">
                  {currentStudents.length === 0 ? (
                    <div className="p-12 text-center text-[#7B8798]">No students found in Class {selectedClass}</div>
                  ) : (
                    currentStudents.map(student => (
                      <div key={student.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <img src={student.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}"} alt={student.name} className="w-12 h-12 rounded-full border border-white/10" />
                          <div>
                            <h3 className="font-semibold text-white">{student.name}</h3>
                            <p className="text-sm text-[#7B8798]">ID: {student.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <input 
                              type="number" 
                              min="0" max="20" step="0.5"
                              value={marksInputs[student.id] || ""}
                              onChange={(e) => setMarksInputs(prev => ({...prev, [student.id]: e.target.value}))}
                              className="w-24 bg-[#131D2E] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-[#5B5CFF] focus:ring-1 focus:ring-[#5B5CFF] outline-none text-right font-medium"
                              placeholder="--"
                            />
                          </div>
                          <span className="text-[#7B8798] font-medium">/ 20</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Entries */}
              {recentMarks.length > 0 && (
                <div className="bg-[#0B1527] border border-white/10 rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                    Recent Submissions (Class {selectedClass})
                  </h3>
                  <div className="space-y-3">
                    {recentMarks.map(mark => {
                      const student = students.find(s => s.id === mark.studentId);
                      const subject = getSubjectsForClass(selectedClass).find(s => s.id === mark.subjectId);
                      return (
                        <div key={mark.id} className="flex items-center justify-between bg-white/[0.02] p-4 rounded-xl border border-white/5">
                          <div>
                            <p className="font-medium text-white">{student?.name || "Unknown Student"} <span className="text-[#7B8798] text-sm ml-2">{subject?.name}</span></p>
                            <p className="text-xs text-[#7B8798] mt-1">{new Date(mark.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 bg-[#22C55E]/10 px-3 py-1 rounded-lg border border-[#22C55E]/20">
                              <Trophy className="w-4 h-4 text-[#22C55E]" />
                              <span className="font-bold text-[#22C55E]">+{mark.marks} XP</span>
                            </div>
                            <button 
                              onClick={() => deleteTestMark(mark.id)}
                              className="p-2 text-[#7B8798] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}







