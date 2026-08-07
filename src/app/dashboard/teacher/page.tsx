"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  FileText, 
  TrendingUp,
  AlertCircle,
  FileEdit,
  Megaphone,
  BookCheck,
  ClipboardCheck,
  CreditCard,
  UserPlus,
  Star,
  CheckCircle2,
  Award,
  Camera,
  X,
  UploadCloud,
  Loader2
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import ImageCropperModal from "@/components/ui/ImageCropperModal";
import { useAuthStore } from "@/store/authStore";
import { useDataStore } from "@/store/dataStore";
import { useDoubtStore } from "@/store/doubtStore";
import { useHomeworkStore } from "@/store/homeworkStore";
import { useNoticeStore } from "@/store/noticeStore";
import { useFeeStore } from "@/store/feeStore";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useRef } from "react";

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function TeacherDashboard() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated, getStudentUsers } = useAuthStore();
  const { initStudentData, getTeacherStats, getAllStudentProgress } = useDataStore();
  
  const [mounted, setMounted] = useState(false);
  const { doubts } = useDoubtStore();
  const { submissions } = useHomeworkStore();
  const { notices } = useNoticeStore();
  const feeState = useFeeStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

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

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      // router.replace("/auth/login"); /* Handled by DashboardLayout */
      return;
    }
    const students = getStudentUsers();
    students.forEach(s => initStudentData(s.id));
    
    setMounted(true);
  }, [isAuthenticated, currentUser, router, getStudentUsers, initStudentData, _hasHydrated]);

  if (!mounted || !currentUser) return null;

  const students = getStudentUsers();
  const studentIds = students.map(s => s.id);
  const stats = getTeacherStats(studentIds);

  const teacherFeedbacks = doubts.filter(d => d.resolvedBy === currentUser.id && d.studentRating !== null);
  const solvedCount = doubts.filter(d => d.resolvedBy === currentUser.id).length;
  
  const averageRating = teacherFeedbacks.length > 0 
    ? (teacherFeedbacks.reduce((acc, d) => acc + (d.studentRating || 0), 0) / teacherFeedbacks.length)
    : 0.0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";

  const kpiCards = [
    { 
      label: "TOTAL STUDENTS", 
      value: stats.totalStudents, 
      trend: "▲ 12 this month", 
      icon: Users, 
      color: "text-[#5B5CFF]", 
      bg: "bg-[#5B5CFF]/10",
      border: "border-[#5B5CFF]/20",
      trendColor: "text-[#5B5CFF]",
      trendPath: "M0 20 Q 10 15, 20 20 T 40 10 T 60 15 T 80 5 T 100 0"
    },
    { 
      label: "DOUBTS SOLVED", 
      value: solvedCount.toString(), 
      trend: "▲ 8% this week", 
      icon: CheckCircle2, 
      color: "text-[#2DD4BF]", 
      bg: "bg-[#2DD4BF]/10",
      border: "border-[#2DD4BF]/20",
      trendColor: "text-[#2DD4BF]",
      trendPath: "M0 20 Q 20 20, 40 15 T 70 10 T 100 5"
    },
    { 
      label: "TEACHER RATING", 
      value: `${averageRating.toFixed(1)}/10`, 
      trend: "▲ 0.3 this month", 
      icon: Star, 
      color: "text-[#FBBF24]", 
      bg: "bg-[#FBBF24]/10",
      border: "border-[#FBBF24]/20",
      trendColor: "text-[#FBBF24]",
      trendPath: "M0 25 Q 15 20, 30 15 T 60 20 T 80 5 T 100 0"
    },
    { 
      label: "ACTIVE DOUBTS", 
      value: doubts.filter(d => d.status === "open" || d.status === "escalated").length.toString(), 
      trend: "▼ 2 since yesterday", 
      icon: AlertCircle, 
      color: "text-[#4F9DFF]", 
      bg: "bg-[#4F9DFF]/10",
      border: "border-[#4F9DFF]/20",
      trendColor: "text-[#4F9DFF]",
      trendPath: "M0 5 Q 20 10, 40 5 T 70 15 T 100 20"
    },
  ];

  const quickActions = [
    { label: "Create\nHomework", icon: FileEdit, href: "/dashboard/teacher/homework/create", color: "text-[#5B5CFF]", bg: "bg-[#5B5CFF]/10", border: "border-[#5B5CFF]/20" },
    { label: "Post\nNotice", icon: Megaphone, href: "/dashboard/teacher/notices/create", color: "text-[#2DD4BF]", bg: "bg-[#2DD4BF]/10", border: "border-[#2DD4BF]/20" },
    { label: "Review\nDoubts", icon: BookCheck, href: "/dashboard/teacher/doubts", color: "text-[#4F9DFF]", bg: "bg-[#4F9DFF]/10", border: "border-[#4F9DFF]/20" },
    { label: "Mark\nAttendance", icon: UserPlus, href: "/dashboard/teacher/students", color: "text-[#FB923C]", bg: "bg-[#FB923C]/10", border: "border-[#FB923C]/20" },
    { label: "Check\nSubmissions", icon: ClipboardCheck, href: "/dashboard/teacher/homework", color: "text-[#F43F5E]", bg: "bg-[#F43F5E]/10", border: "border-[#F43F5E]/20" },
    { label: "View\nReports", icon: FileText, href: "#", color: "text-[#8B5CF6]", bg: "bg-[#8B5CF6]/10", border: "border-[#8B5CF6]/20" },
  ];

  return (
    <DashboardLayout role="teacher">
      <motion.div 
        className="space-y-8 max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] text-white flex items-center justify-center font-bold text-xl sm:text-2xl shrink-0 overflow-hidden shadow-lg border border-white/10 group cursor-pointer"
              onClick={() => setShowAvatarModal(true)}
            >
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getInitials(currentUser.name)
              )}
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white mb-1" />
                <span className="text-[10px] font-medium text-white">Update</span>
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                Good {greeting}, {currentUser.name}! <span className="animate-wave origin-bottom-right inline-block">👋</span>
              </h1>
              <p className="text-[13px] sm:text-sm text-[#7B8798] mt-1.5 font-medium">Here's what's happening in your classes today.</p>
            </div>
          </div>
          
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B5CFF]/10 border border-[#5B5CFF]/20 text-[#5B5CFF] font-medium text-sm hover:bg-[#5B5CFF]/20 transition-colors w-fit">
            <Star className="w-4 h-4" />
            AI Assistant
          </button>
        </motion.div>

        {/* Quick Actions Row */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-base font-semibold text-white">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, i) => (
              <Link key={i} href={action.href} className="block">
                <GlassCard hoverEffect className="p-4 flex flex-col items-center justify-center gap-3 aspect-[4/3] group/card relative overflow-hidden">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover/card:scale-110", action.bg, action.color, action.border)}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#B6C2D9] text-center leading-tight group-hover/card:text-white transition-colors">
                    {action.label.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
                  </span>
                  
                  {/* Hover Glow */}
                  <div className={cn("absolute inset-0 opacity-0 group-hover/card:opacity-[0.03] transition-opacity duration-300", action.bg)} />
                </GlassCard>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Recent Activity</h2>
              <button className="text-[12px] font-medium text-[#5B5CFF] hover:text-[#4F9DFF] transition-colors">View All</button>
            </div>
            
            <GlassCard className="p-6">
              <div className="space-y-6">
                {(() => {
                  const recentActivities = [];

                  // Latest Submission
                  const latestSubmission = [...submissions].sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime())[0];
                  if (latestSubmission) {
                    recentActivities.push({
                      title: "Homework Submitted",
                      desc: `${(latestSubmission as any).studentName || "A student"} submitted ${(latestSubmission as any).subjectName || "homework"}`,
                      time: latestSubmission.submittedAt,
                      icon: FileText,
                      color: "text-[#2DD4BF]", bg: "bg-[#2DD4BF]/10", border: "border-[#2DD4BF]/20",
                      href: "/dashboard/teacher/homework"
                    });
                  }

                  // Latest Doubt
                  const latestDoubt = [...doubts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                  if (latestDoubt) {
                    recentActivities.push({
                      title: "New Doubt Raised",
                      desc: `${latestDoubt.studentName} asked a question in ${latestDoubt.subjectName}`,
                      time: latestDoubt.createdAt,
                      icon: AlertCircle,
                      color: "text-[#F43F5E]", bg: "bg-[#F43F5E]/10", border: "border-[#F43F5E]/20",
                      href: "/dashboard/teacher/doubts"
                    });
                  }

                  // Latest Notice
                  const latestNotice = [...notices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                  if (latestNotice) {
                    recentActivities.push({
                      title: "Notice Published",
                      desc: latestNotice.title,
                      time: latestNotice.createdAt,
                      icon: Megaphone,
                      color: "text-[#4F9DFF]", bg: "bg-[#4F9DFF]/10", border: "border-[#4F9DFF]/20",
                      href: "/dashboard/teacher/notices"
                    });
                  }

                  // Latest Fee Payment
                  const latestPayment = [...feeState.payments].sort((a, b) => new Date(b.paymentDate || 0).getTime() - new Date(a.paymentDate || 0).getTime())[0];
                  if (latestPayment) {
                    recentActivities.push({
                      title: "Fee Collection",
                      desc: `${(latestPayment as any).studentName || 'Student'} paid their monthly fees`,
                      time: latestPayment.paymentDate,
                      icon: CreditCard,
                      color: "text-[#FBBF24]", bg: "bg-[#FBBF24]/10", border: "border-[#FBBF24]/20",
                      href: "/dashboard/teacher/fees"
                    });
                  }

                  recentActivities.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
                  const topActivities = recentActivities.slice(0, 4);

                  if (topActivities.length === 0) {
                    return <div className="text-[#7B8798] text-sm text-center py-4">No recent activity</div>;
                  }

                  return topActivities.map((act, i) => (
                    <Link key={i} href={act.href} className="flex gap-4 group cursor-pointer">
                      <div className="flex flex-col items-center">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110", act.bg, act.color, act.border)}>
                          <act.icon className="w-4 h-4" />
                        </div>
                        {i !== topActivities.length - 1 && <div className="w-[1px] h-full bg-white/[0.06] my-2 group-hover:bg-[#5B5CFF]/30 transition-colors" />}
                      </div>
                      <div className="flex-1 pb-2 flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-semibold text-white group-hover:text-[#5B5CFF] transition-colors">{act.title}</h4>
                          <p className="text-[12px] text-[#7B8798] mt-1">{act.desc}</p>
                        </div>
                        <span className="text-[11px] font-medium text-[#4B5563] whitespace-nowrap ml-2">
                          {formatDistanceToNow(new Date(act.time || 0), { addSuffix: true })}
                        </span>
                      </div>
                    </Link>
                  ));
                })()}
              </div>
            </GlassCard>
          </motion.div>

          {/* Right Column: Teacher Profile & Performance */}
          <motion.div variants={itemVariants} className="space-y-4">
             <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Profile & Performance</h2>
            </div>
            
            <GlassCard className="p-6 relative overflow-hidden">
               {/* Background glow */}
               <div className="absolute -top-10 -right-10 w-40 h-40 blur-3xl opacity-10 bg-[#FBBF24]" />
               
                <div className="flex flex-col items-center text-center mb-6">
                 <div className="w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-[#1E293B] to-[#0F172A] shadow-xl relative mb-3">
                   <svg width="96" height="96" className="absolute inset-0 transform -rotate-90">
                     <circle cx="48" cy="48" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" />
                     <motion.circle 
                       cx="48" cy="48" r="45" 
                       stroke="#FBBF24" strokeWidth="4" fill="transparent" 
                       strokeDasharray={2 * Math.PI * 45} 
                       strokeDashoffset={2 * Math.PI * 45 * (1 - averageRating / 10)} 
                       strokeLinecap="round" 
                       initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                       animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - averageRating / 10) }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                     />
                   </svg>
                   <div className="text-center relative z-10">
                     <p className="text-2xl font-bold text-white leading-none">{averageRating.toFixed(1)}</p>
                     <p className="text-[10px] text-[#FBBF24] font-bold uppercase tracking-widest mt-1">/ 10</p>
                   </div>
                 </div>
                 <h3 className="text-white font-semibold">{currentUser.name}</h3>
                 <p className="text-xs text-[#7B8798] mt-1">Average Student Rating</p>
               </div>
               
               <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                   <CheckCircle2 className="w-5 h-5 text-[#2DD4BF] mx-auto mb-1.5" />
                   <p className="text-lg font-bold text-white leading-none">{solvedCount}</p>
                   <p className="text-[10px] text-[#7B8798] font-semibold uppercase tracking-wider mt-1">Solved</p>
                 </div>
                 <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                   <Star className="w-5 h-5 text-[#FBBF24] mx-auto mb-1.5" />
                   <p className="text-lg font-bold text-white leading-none">{teacherFeedbacks.length}</p>
                   <p className="text-[10px] text-[#7B8798] font-semibold uppercase tracking-wider mt-1">Reviews</p>
                 </div>
               </div>

               <div className="space-y-3">
                 <h4 className="text-xs font-semibold text-[#B6C2D9] uppercase tracking-wider mb-2">Recent Feedback</h4>
                 {teacherFeedbacks.length === 0 ? (
                   <p className="text-[12px] text-[#7B8798] text-center italic py-2">No feedback received yet.</p>
                 ) : (
                   teacherFeedbacks.slice(-2).reverse().map((fb, idx) => (
                     <div key={idx} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
                       <div className="flex items-center justify-between mb-1">
                         <div className="flex gap-0.5">
                           {[1,2,3,4,5].map(s => (
                             <Star key={s} className={`w-3 h-3 ${s <= (fb.studentRating! / 2) ? "fill-[#FBBF24] text-[#FBBF24]" : "text-white/10"}`} />
                           ))}
                         </div>
                         <span className="text-[10px] text-[#7B8798]">{new Date(fb.updatedAt).toLocaleDateString()}</span>
                       </div>
                       {fb.studentFeedback && (
                         <p className="text-[11px] text-[#E2E8F0] italic line-clamp-2 leading-relaxed">"{fb.studentFeedback}"</p>
                       )}
                     </div>
                   ))
                 )}
               </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>

      {/* Avatar Upload Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#07111F]/80 backdrop-blur-sm"
              onClick={() => setShowAvatarModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#131D2E] border border-white/[0.08] rounded-[24px] p-6 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-[#5B5CFF]/20 to-[#8B5CF6]/20 opacity-50" />
              
              <button
                onClick={() => setShowAvatarModal(false)}
                className="absolute top-4 right-4 p-2 text-[#7B8798] hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10 flex flex-col items-center text-center mt-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] p-1 mb-4 shadow-xl">
                  <div className="w-full h-full rounded-full bg-[#131D2E] flex items-center justify-center overflow-hidden border-2 border-[#131D2E]">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-white">{getInitials(currentUser.name)}</span>
                    )}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1">Update Profile Picture</h3>
                <p className="text-sm text-[#7B8798] mb-6">Choose a clear photo so your students can easily recognize you.</p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-[#5B5CFF] to-[#8B5CF6] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#5B5CFF]/25 transition-all active:scale-[0.98]"
                  >
                    <UploadCloud className="w-5 h-5" />
                    Choose Image
                  </button>
                  
                  {currentUser.avatar && (
                    <button
                      onClick={() => {
                        useAuthStore.getState().updateAvatar(currentUser.id, '');
                        setShowAvatarModal(false);
                      }}
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/5 text-[#EF4444] rounded-xl font-medium hover:bg-[#EF4444]/10 transition-colors"
                    >
                      Remove Current Picture
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImageCropperModal
        isOpen={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false);
          setRawImageSrc(null);
        }}
        imageSrc={rawImageSrc || ''}
        onCropComplete={handleCropComplete}
      />
    </DashboardLayout>
  );
}
