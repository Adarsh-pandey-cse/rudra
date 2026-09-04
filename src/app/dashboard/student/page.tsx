'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Target, ChevronRight, BookOpen, 
  Trophy, Bot, MessageCircleQuestion, Megaphone, CheckCircle, Brain, CalendarDays,
  Bell, FileText, Sparkles, Camera, X, UploadCloud, Flame, Crown
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import CircularProgress from '@/components/dashboard/CircularProgress';
import MasteryBar from '@/components/dashboard/MasteryBar';
import ImageCropperModal from '@/components/ui/ImageCropperModal';

import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { useHomeworkStore } from '@/store/homeworkStore';
import { useNoticeStore } from '@/store/noticeStore';
import { useDoubtStore } from '@/store/doubtStore';
import { useLeaderboardStore } from '@/store/leaderboardStore';
import { useTestStore } from '@/store/testStore';
import { getSubjectsForClass } from '@/data/curriculum-index';
import { getMasteryColor, getMasteryLevel, Student } from '@/types';

const AVATAR_EMOJIS = ["👨‍🎓", "👩‍🎓", "🎓", "🎒", "📚", "✍️", "🎯", "🚀", "💻", "🧠"];

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function StudentDashboard() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const { initStudentData, getStudentStats, getStudentProgress } = useDataStore();
  const { getStudentAssignments, getSubmission } = useHomeworkStore();
  const assignmentsList = useHomeworkStore(state => state.assignments);
  const submissionsList = useHomeworkStore(state => state.submissions);
  const { getStudentNotices, getUnreadCount, isRead, markAsRead } = useNoticeStore();
  const noticesList = useNoticeStore(state => state.notices);
  const { getStudentDoubts } = useDoubtStore();
  const doubtsList = useDoubtStore(state => state.doubts);
  const leaderboardEntries = useLeaderboardStore(state => state.entries);
  const { initializeTestsListener, getMarksForStudent } = useTestStore();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== 'student') {
      // router.replace("/auth/login"); /* Handled by DashboardLayout */
      return;
    }

    if (currentUser) {
      initStudentData(currentUser.id);
      const unsubTests = initializeTestsListener("student", currentUser.id);
      setIsLoaded(true);
      return () => {
        unsubTests();
      };
    }
  }, [isAuthenticated, currentUser, router, initStudentData, _hasHydrated, initializeTestsListener]);

  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout role="student">
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#5B5CFF]"></div>
        </div>
      </DashboardLayout>
    );
  }

  const student = currentUser as Student;
  const classId = student.classId || student.grade;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setRawImageSrc(event.target.result);
        setCropModalOpen(true);
        setShowAvatarModal(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedImageBase64: string) => {
    if (currentUser) {
      useAuthStore.getState().updateAvatar(currentUser.id, croppedImageBase64);
    }
    setCropModalOpen(false);
    setRawImageSrc(null);
  };

  const stats = getStudentStats(currentUser.id);
  const progress = getStudentProgress(currentUser.id);
  
  // Real Data Fetching
  const allAssignments = getStudentAssignments(currentUser.id);
  
  let totalPossiblePoints = 0;
  let totalEarnedPoints = 0;
  
  allAssignments.forEach(a => {
      const isPastDue = new Date(a.dueDate).getTime() < new Date().getTime();
      const sub = getSubmission(a.id, currentUser.id);
      
      if (sub && sub.status !== 'pending' && sub.status !== 'draft') {
          totalPossiblePoints += a.maxMarks;
          totalEarnedPoints += sub.grade || 0;
      } else if (isPastDue) {
          totalPossiblePoints += a.maxMarks;
          totalEarnedPoints += 0;
      }
  });

  const pendingHomework = allAssignments.filter(a => {
    const isPastDue = new Date(a.dueDate).getTime() < new Date().getTime();
    const sub = getSubmission(a.id, currentUser.id);
    const isPending = !sub || ["pending", "draft", "rejected", "resubmission_requested"].includes(sub.status);
    return isPending && !isPastDue;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  
  const myNotices = getStudentNotices(currentUser.id, classId);
  const unreadNoticesCount = getUnreadCount(currentUser.id, classId);
  const myDoubts = getStudentDoubts(currentUser.id);
  const unresolvedDoubts = myDoubts.filter(d => d.status !== 'resolved');

  const weakTopics = progress?.weakTopics.slice(0, 3) || [];
  
  const subjectMap = new Map<string, { subjectId: string, overallScore: number, count: number, assignments: { title: string, grade: number, maxMarks: number }[] }>();
  
  allAssignments.forEach(a => {
    const sub = getSubmission(a.id, currentUser.id);
    if (sub && sub.status !== 'pending' && sub.status !== 'draft' && typeof sub.grade === 'number') {
      const subject = a.subjectId || "General";
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, { subjectId: subject, overallScore: 0, count: 0, assignments: [] });
      }
      const s = subjectMap.get(subject)!;
      s.overallScore += (sub.grade / a.maxMarks) * 100;
      s.count += 1;
      s.assignments.push({
        title: a.title,
        grade: sub.grade,
        maxMarks: a.maxMarks
      });
    }
  });
  
  const subjects = Array.from(subjectMap.values()).map(s => ({
    ...s,
    overallMastery: Math.round(s.overallScore / s.count)
  }));

  const nextHomework = pendingHomework.length > 0 ? pendingHomework[0] : null;

  const recentTests = getMarksForStudent(currentUser.id).slice(0, 3);
  
  const getPraiseWord = (marks: number) => {
    if (marks === 20) {
      const words = ["Excellent!", "Outstanding!", "Wonderful!", "Perfect!", "Brilliant!"];
      return words[Math.floor(Math.random() * words.length)];
    }
    if (marks >= 17) return "Excellent";
    if (marks >= 12) return "Average to Good";
    if (marks >= 10) return "Needs Improvement";
    if (marks >= 5) return "Under Performance";
    return "Very Poor";
  };

  const unreadNotices = myNotices.filter(n => !isRead(n.id, currentUser.id));
  const recentNotice = unreadNotices.length > 0 ? unreadNotices[0] : null;

  return (
    <DashboardLayout role="student">
      <motion.div 
        className="mx-auto max-w-7xl space-y-8 pb-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-6 items-center md:items-start justify-between">
          <div className="flex-1 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
            <div 
              className="w-20 h-20 md:w-24 md:h-24 rounded-full shrink-0 relative group cursor-pointer border-[3px] border-[#5B5CFF]/30 p-[3px] shadow-[0_0_20px_rgba(91,92,255,0.15)] transition-transform hover:scale-105"
              onClick={() => setShowAvatarModal(true)}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#07111F] to-[#131D2E] flex items-center justify-center overflow-hidden">
                {currentUser.avatar ? (
                  currentUser.avatar.length < 10 ? (
                    <span className="text-4xl md:text-5xl">{currentUser.avatar}</span>
                  ) : (
                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  )
                ) : (
                  <span className="text-2xl md:text-3xl font-bold text-white">{getInitials(currentUser.name)}</span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-[#07111F]/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity m-[3px]">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="flex flex-col justify-center h-full pt-1 md:pt-3">
              <h1 className="text-2xl md:text-[28px] font-bold text-white mb-2">
                {getGreeting()}, <span className="bg-gradient-to-r from-[#5B5CFF] to-[#2DD4BF] bg-clip-text text-transparent">{currentUser.name.split(' ')[0]}</span>! 👋
              </h1>
              <p className="text-sm md:text-base text-[#B6C2D9]">
                {pendingHomework.length === 0 
                  ? "You're all caught up! Great job."
                  : `You have ${pendingHomework.length} assignments pending. Let's get to work!`}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/10 w-fit">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#7B8798]" />
                  <span className="text-[13px] text-[#7B8798]">
                    Class Started: <strong className="text-[#B6C2D9]">{new Date(currentUser.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                  </span>
                </div>
                
                {/* Royal Animated Streak Badge */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#F59E0B]/10 to-[#EF4444]/10 border border-[#F59E0B]/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] relative overflow-hidden group cursor-default">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F59E0B]/20 to-[#EF4444]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <motion.svg 
                    width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                    animate={{ scale: [1, 1.15, 1], rotate: [-3, 3, -3] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    className="drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                  >
                    <path d="M12 23C12 23 4 16.5 4 10C4 5.5 7.5 2 12 2C16.5 2 20 5.5 20 10C20 16.5 12 23 12 23Z" fill="url(#fireGradOut)" />
                    <path d="M12 21.5C12 21.5 7 16 7 11C7 8 9 6 12 6C15 6 17 8 17 11C17 16 12 21.5 12 21.5Z" fill="url(#fireGradIn)" />
                    <defs>
                      <linearGradient id="fireGradOut" x1="12" y1="2" x2="12" y2="23" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F59E0B" />
                        <stop offset="1" stopColor="#EF4444" />
                      </linearGradient>
                      <linearGradient id="fireGradIn" x1="12" y1="6" x2="12" y2="21.5" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FEF08A" />
                        <stop offset="1" stopColor="#F97316" />
                      </linearGradient>
                    </defs>
                  </motion.svg>
                  <span className="text-[14px] font-bold bg-gradient-to-r from-[#FDE047] via-[#F59E0B] to-[#EF4444] bg-clip-text text-transparent drop-shadow-sm tracking-wide">
                    {leaderboardEntries.find(e => e.studentId === currentUser.id)?.streak || 0} Streak
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Row - Now Clickable */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Quick Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <GlassCard hoverEffect onClick={() => router.push('/dashboard/student/homework')} className="p-4 flex items-center gap-4 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{pendingHomework.length}</div>
              <div className="text-[13px] text-[#7B8798]">Pending Homework</div>
            </div>
          </GlassCard>
            <GlassCard hoverEffect onClick={() => router.push('/dashboard/student/doubts')} className="p-4 flex items-center gap-4 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                <MessageCircleQuestion className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{unresolvedDoubts.length}</div>
                <div className="text-[13px] text-[#7B8798]">Unresolved Doubts</div>
              </div>
            </GlassCard>

            <GlassCard hoverEffect onClick={() => router.push('/dashboard/student/notes')} className="p-4 flex items-center gap-4 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">Notes</div>
                <div className="text-[13px] text-[#7B8798]">View Materials</div>
              </div>
            </GlassCard>
          <GlassCard hoverEffect onClick={() => {
                  if (recentNotice) markAsRead(recentNotice.id, currentUser.id);
                  router.push('/dashboard/student/notices');
                }} className="p-4 flex items-center gap-4 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white relative inline-block">
                {unreadNoticesCount}
                {unreadNoticesCount > 0 && (
                  <span className="absolute -top-3 -right-6 bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400">
                    +{unreadNoticesCount}
                  </span>
                )}
              </div>
              <div className="text-[13px] text-[#7B8798]">New Notices</div>
            </div>
          </GlassCard>

          <GlassCard hoverEffect onClick={() => router.push('/dashboard/student/leaderboard')} className="p-4 flex items-center gap-4 cursor-pointer relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#EAB308]/10 to-[#F59E0B]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EAB308]/20 to-[#F59E0B]/20 flex items-center justify-center shrink-0 border border-[#EAB308]/30">
              <Crown className="w-5 h-5 text-[#EAB308]" />
            </div>
            <div>
              <div className="text-xl font-bold text-white flex items-baseline gap-1 drop-shadow-md">
                #{leaderboardEntries.find(e => e.studentId === currentUser.id)?.rank || "-"}
              </div>
              <div className="text-[13px] font-medium text-[#EAB308]">Global Rank</div>
            </div>
          </GlassCard>

          <GlassCard hoverEffect onClick={() => router.push('/dashboard/student/leaderboard')} className="p-4 flex items-center gap-4 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white flex items-baseline gap-1">
                {leaderboardEntries.find(e => e.studentId === currentUser.id)?.points || 0}
                <span className="text-sm text-[#7B8798] font-normal">XP</span>
              </div>
              <div className="text-[13px] text-[#7B8798]">Total Points</div>
            </div>
          </GlassCard>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8">

          {/* Latest Notice (Full Width) */}
          {recentNotice && (
            <motion.div variants={itemVariants}>
              <GlassCard className="p-6 border-white/10 relative overflow-hidden group cursor-pointer hover:border-white/20 transition-all shadow-lg"
                onClick={() => {
                  if (recentNotice) markAsRead(recentNotice.id, currentUser.id);
                  router.push('/dashboard/student/notices');
                }}
              >
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none ${
                  recentNotice.priority === 'critical' ? 'bg-[#EF4444]/20' :
                  recentNotice.priority === 'high' ? 'bg-[#F59E0B]/20' :
                  'bg-[#3B82F6]/20'
                }`} />
                <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
                  <div className="shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      recentNotice.priority === 'critical' ? 'bg-[#EF4444]/20' :
                      recentNotice.priority === 'high' ? 'bg-[#F59E0B]/20' :
                      'bg-[#3B82F6]/20'
                    }`}>
                      <Bell className={`w-6 h-6 ${
                        recentNotice.priority === 'critical' ? 'text-[#EF4444]' :
                        recentNotice.priority === 'high' ? 'text-[#F59E0B]' :
                        'text-[#3B82F6]'
                      }`} />
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-white">{recentNotice.title}</h3>
                      {recentNotice.priority === 'critical' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 uppercase">Urgent</span>
                      )}
                    </div>
                    <p className="text-sm text-[#B6C2D9] mb-4 whitespace-pre-wrap">{recentNotice.body}</p>
                    <div className="flex items-center text-[13px] text-[#7B8798] transition-colors group-hover:text-white">
                      <span className="font-medium">View in Notice Board</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Main Content Column */}
          <div className="space-y-8">
            
            {/* Offline Tests Section */}
            {recentTests.length > 0 && (
              <motion.div variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Recent Test Marks</h2>
                <div className="grid grid-cols-1 gap-4">
                  {recentTests.map(test => {
                    const subjectName = getSubjectsForClass(classId).find(s => s.id === test.subjectId)?.name || test.subjectId;
                    return (
                      <GlassCard key={test.id} className="p-5 flex flex-col justify-between border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-indigo-400" />
                              <span className="font-semibold text-white">{subjectName} Test</span>
                            </div>
                            <p className="text-[12px] text-[#7B8798]">
                              {new Date(test.createdAt).toLocaleDateString()} at {new Date(test.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-white mb-0.5">
                              {test.marks}<span className="text-sm text-[#7B8798]">/20</span>
                            </div>
                            <div className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full inline-block ${
                              test.marks >= 17 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              test.marks >= 12 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              test.marks >= 10 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {getPraiseWord(test.marks)}
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Action Center */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Action Center</h2>
              <div className="grid grid-cols-1 gap-4">
              
              {/* Next Up Homework */}
              <GlassCard className="p-5 flex flex-col justify-between border-[#5B5CFF]/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5B5CFF]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#4F9DFF]" />
                    <span className="text-sm font-semibold text-[#4F9DFF]">Next Up</span>
                  </div>
                  {nextHomework ? (
                    <>
                      <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{nextHomework.title}</h3>
                      <p className="text-[13px] text-[#B6C2D9] mb-4">Due: {new Date(nextHomework.dueDate).toLocaleDateString()}</p>
                      <GradientButton 
                        onClick={() => router.push(`/dashboard/student/homework/${nextHomework.id}`)}
                        className="w-full py-2.5 text-sm"
                      >
                        Start Assignment
                      </GradientButton>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <CheckCircle className="w-10 h-10 text-emerald-400/50 mb-2" />
                      <p className="text-sm font-medium text-white">All Caught Up!</p>
                      <p className="text-[12px] text-[#7B8798]">No pending homework.</p>
                    </div>
                  )}
                </div>
              </GlassCard>

              </div>
            </motion.div>

            {/* Subject Mastery */}
            <motion.div className="space-y-4" variants={itemVariants}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Subject Mastery</h2>
                <span onClick={() => router.push('/dashboard/student/progress')} className="text-[13px] text-[#5B5CFF] cursor-pointer hover:underline">View Details &gt;</span>
              </div>
              
              {subjects.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {subjects.map((subject) => (
                    <GlassCard key={subject.subjectId} className="p-5 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg text-white capitalize">{subject.subjectId}</h3>
                        <span className="text-lg font-bold" style={{ color: getMasteryColor(getMasteryLevel(subject.overallMastery)) }}>
                          {subject.overallMastery}%
                        </span>
                      </div>
                      <div className="space-y-4 mt-2">
                        {subject.assignments.slice(0, 3).map((assignment, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <MasteryBar value={Math.round((assignment.grade / assignment.maxMarks) * 100)} label={assignment.title} />
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <GlassCard className="p-8 text-center border-dashed border-white/10 bg-white/5">
                  <BookOpen className="w-10 h-10 text-[#7B8798]/50 mx-auto mb-3" />
                  <p className="text-sm font-medium text-white mb-1">No Progress Data Yet</p>
                  <p className="text-[13px] text-[#7B8798]">Complete your first homework to see your subject mastery.</p>
                </GlassCard>
              )}
            </motion.div>
          </div>

          {/* Removed Right Column */}
        </div>

      </motion.div>

      {/* Avatar Selection Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#07111F]/80 backdrop-blur-sm"
              onClick={() => setShowAvatarModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#131D2E] rounded-[24px] border border-white/[0.08] p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-white">Choose Profile Picture</h2>
                <button onClick={() => setShowAvatarModal(false)} className="text-[#7B8798] hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-[#B6C2D9] mb-3">Upload a Photo</h3>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-[#5B5CFF]/30 rounded-[16px] bg-[#5B5CFF]/5 hover:bg-[#5B5CFF]/10 transition-colors flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <UploadCloud className="w-6 h-6 text-[#5B5CFF] mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-[#4F9DFF]">Click to browse</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px bg-white/[0.08] flex-1" />
                    <span className="text-xs font-medium text-[#7B8798] uppercase tracking-wider">OR CHOOSE EMOJI</span>
                    <div className="h-px bg-white/[0.08] flex-1" />
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {AVATAR_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          useAuthStore.getState().updateAvatar(currentUser.id, emoji);
                          setShowAvatarModal(false);
                        }}
                        className="aspect-square rounded-[12px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] hover:border-white/[0.1] flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImageCropperModal
        isOpen={cropModalOpen}
        imageSrc={rawImageSrc}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </DashboardLayout>
  );
}




