"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { BarChart3, TrendingUp, AlertCircle, BookOpen, Users } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { useHomeworkStore } from "@/store/homeworkStore";
import { useLeaderboardStore } from "@/store/leaderboardStore";
import type { Student, StudentProgress } from "@/types";

import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import StudentProgressCard from "@/components/dashboard/StudentProgressCard";
import EmptyState from "@/components/ui/EmptyState";
import GradientButton from "@/components/ui/GradientButton";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function TeacherProgressPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated, getAllUsers } = useAuthStore();
  const { assignments, submissions } = useHomeworkStore();
  const { entries } = useLeaderboardStore();

  const [isLoading, setIsLoading] = useState(true);

  // Initialize and load student data
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      router.replace("/login");
      return;
    }
    
    setIsLoading(false);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  // Derived state
  const { students, studentProgressMap, stats } = useMemo(() => {
    if (isLoading) return { students: [], studentProgressMap: {} as Record<string, StudentProgress>, stats: null };
    
    const allUsers = getAllUsers();
    let studentsList = allUsers.filter((u): u is Student => u.role === "student");
    
    // Sort students: active first, deleted/archived last
    studentsList.sort((a, b) => {
      const aPast = a.status === 'deleted' || a.status === 'archived' ? 1 : 0;
      const bPast = b.status === 'deleted' || b.status === 'archived' ? 1 : 0;
      if (aPast !== bPast) return aPast - bPast;
      return a.name.localeCompare(b.name);
    });

    const progressMap: Record<string, StudentProgress> = {};
    let totalScore = 0;
    let studentsAtRisk = 0;
    let totalPending = 0;
    
    studentsList.forEach(student => {
      // Find streak
      const streak = entries.find(e => e.studentId === student.id)?.streak || 0;
      
      // Find assignments
      const studentClassId = student.classId || student.grade;
      const studentAssignments = assignments.filter(a => {
        if ((a as any).targetClassId && (a as any).targetClassId !== "-") {
          return studentClassId === (a as any).targetClassId;
        }
        return (a as any).assignedTo?.includes(student.id) || (a as any).recipientStudentIds?.includes(student.id);
      });
      
      const studentSubmissions = submissions.filter(s => s.studentId === student.id);
      
      // Calculate Score
      let scoreSum = 0;
      let evaluatedCount = 0;
      let weakTopicsSet = new Set<string>();
      let strongTopicsSet = new Set<string>();
      
      studentSubmissions.forEach(sub => {
        if (sub.teacherGrade !== null && sub.teacherGrade !== undefined) {
          scoreSum += Math.round((sub.teacherGrade / sub.maxMarks) * 100);
          evaluatedCount++;
        } else if (sub.aiEvaluation?.percentage) {
          scoreSum += sub.aiEvaluation.percentage;
          evaluatedCount++;
        }
        
        if (sub.aiEvaluation) {
          sub.aiEvaluation.weakTopics?.forEach((t: string) => weakTopicsSet.add(t));
          sub.aiEvaluation.strongTopics?.forEach((t: string) => strongTopicsSet.add(t));
        }
      });
      
      const overallScore = evaluatedCount > 0 ? Math.round(scoreSum / evaluatedCount) : 0;
      const pendingCount = studentAssignments.length - studentSubmissions.length;
      
      progressMap[student.id] = {
        studentId: student.id,
        overallScore,
        studyStreak: streak,
        studyHoursToday: 0,
        homeworkCompleted: studentSubmissions.length,
        homeworkTotal: studentAssignments.length,
        topicProgress: [], 
        weakTopics: Array.from(weakTopicsSet),
        strongTopics: Array.from(strongTopicsSet),
      };
      
      totalScore += overallScore;
      if (overallScore > 0 && overallScore < 40) studentsAtRisk++;
      if (pendingCount > 0) totalPending += pendingCount;
    });

    const activeStudents = studentsList.filter(s => s.status !== 'deleted' && s.status !== 'archived');
    const teacherStats = {
      totalStudents: activeStudents.length,
      activeToday: activeStudents.length,
      homeworkPending: totalPending,
      avgClassScore: studentsList.length > 0 ? Math.round(totalScore / studentsList.length) : 0,
      syllabusProgress: Math.min(95, 40 + activeStudents.length * 3),
      studentsAtRisk: studentsAtRisk,
    };

    return {
      students: studentsList,
      studentProgressMap: progressMap,
      stats: teacherStats,
    };
  }, [isLoading, getAllUsers, assignments, submissions, entries]);

  if (!isAuthenticated || currentUser?.role !== "teacher" || isLoading) {
    return null;
  }

  return (
    <DashboardLayout role="teacher">
      <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-white mb-2">Student Progress</h1>
          <p className="text-sm text-[#B6C2D9]">Monitor and analyze your students' performance across all topics.</p>
        </motion.div>

        {/* Overview Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-6 hover:bg-white/[0.10] transition-colors cursor-default">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#4F9DFF]/10 border border-[#4F9DFF]/20 rounded-xl">
                <BarChart3 className="w-5 h-5 text-[#4F9DFF]" />
              </div>
              <div>
                <p className="text-[13px] text-[#7B8798]">Class Average</p>
                <p className="text-xl font-bold text-white">{stats?.avgClassScore || 0}%</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 hover:bg-white/[0.10] transition-colors cursor-default">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl">
                <TrendingUp className="w-5 h-5 text-[#22C55E]" />
              </div>
              <div>
                <p className="text-[13px] text-[#7B8798]">Syllabus Covered</p>
                <p className="text-xl font-bold text-white">{stats?.syllabusProgress || 0}%</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 hover:bg-white/[0.10] transition-colors cursor-default">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div>
                <p className="text-[13px] text-[#7B8798]">Needs Attention</p>
                <p className="text-xl font-bold text-white">{stats?.studentsAtRisk || 0} Students</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-6 hover:bg-white/[0.10] transition-colors cursor-default">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-xl">
                <BookOpen className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div>
                <p className="text-[13px] text-[#7B8798]">Pending Homework</p>
                <p className="text-xl font-bold text-white">{stats?.homeworkPending || 0} Tasks</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Students Grid */}
        <motion.div variants={itemVariants} className="pt-2">
          <h2 className="text-lg font-semibold text-white mb-6">Detailed Progress</h2>
          
          {students.length === 0 ? (
            <EmptyState
              icon={<Users className="w-12 h-12 text-[#7B8798]" />}
              title="No Students Yet"
              description="Add students to your class to track their progress."
              action={
                <GradientButton onClick={() => router.push("/dashboard/teacher/students/add")}>
                  Add Student
                </GradientButton>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => {
                const progress = studentProgressMap[student.id];
                if (!progress) return null;
                
                return (
                  <motion.div key={student.id} variants={itemVariants}>
                    <StudentProgressCard 
                      student={student} 
                      progress={progress} 
                      isPastStudent={student.status === 'deleted' || student.status === 'archived'}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
