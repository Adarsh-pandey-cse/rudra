"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  TrendingUp, BookOpen, Target, Zap, 
  Award, Flame, Calendar, AlertCircle, BarChart3, ChevronDown
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, Cell
} from 'recharts';

import { useAuthStore } from "@/store/authStore";
import { useAnalyticsStore } from "@/store/analyticsStore";
import { useLeaderboardStore } from "@/store/leaderboardStore";
import { useHomeworkStore } from "@/store/homeworkStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { getMasteryColor } from "@/types";

const containerVariants: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants: any = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

// Utility to generate smooth historical mock data ending at a target value
const generateHistoricalData = (target: number, months: number = 6, variance: number = 5) => {
  const data = [];
  const startValue = Math.max(10, target - (months * variance));
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  
  let currentVal = startValue;
  for (let i = months - 1; i >= 0; i--) {
    let monthIdx = currentMonth - i;
    if (monthIdx < 0) monthIdx += 12;
    
    // Smooth progression with slight randomness
    if (i === 0) {
      currentVal = target;
    } else {
      currentVal = currentVal + (target - currentVal) / (i + 1) + (Math.random() * 4 - 2);
    }
    
    data.push({
      name: monthNames[monthIdx],
      value: Math.min(100, Math.max(0, Math.round(currentVal)))
    });
  }
  return data;
};

// Custom Tooltips for Recharts
const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#07111F]/90 backdrop-blur-md border border-white/[0.1] p-3 rounded-[12px] shadow-2xl">
        <p className="text-[#7B8798] text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white font-bold text-lg flex items-center gap-2">
          {payload[0].value}% 
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#5B5CFF]/20 text-[#5B5CFF]">Mastery</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#07111F]/90 backdrop-blur-md border border-white/[0.1] p-3 rounded-[12px] shadow-2xl">
        <p className="text-[#7B8798] text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white font-bold text-lg flex items-center gap-2">
          +{payload[0].value} 
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#2DD4BF]/20 text-[#2DD4BF]">Points</span>
        </p>
      </div>
    );
  }
  return null;
};


export default function StudentProgressPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const { getStudentProgress } = useAnalyticsStore();
  const { getLeaderboard } = useLeaderboardStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "student") {
      router.replace("/auth/login");
      return;
    }
    setMounted(true);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  // Real data fetch
  const { getStudentAssignments, getSubmission } = useHomeworkStore.getState();
  const allAssignments = currentUser ? getStudentAssignments(currentUser.id) : [];

  const progress = currentUser ? getStudentProgress(currentUser.id) : {} as any;
  const leaderboardEntry = currentUser ? getLeaderboard().find(e => e.studentId === currentUser.id) : null;
  
  const overallMastery = progress?.overallScore || 68;
  const currentPoints = leaderboardEntry?.points || 1200;
  const weakTopics = progress?.weakTopics || [];

  // Group subject progress dynamically based on real assignments
  const subjectMap = new Map<string, { total: number, count: number }>();
  
  allAssignments.forEach(a => {
    if (!currentUser) return;
    const sub = getSubmission(a.id, currentUser.id);
    if (sub && sub.status !== 'pending' && sub.status !== 'draft' && typeof sub.grade === 'number') {
      const subject = a.subjectId || "General";
      const existing = subjectMap.get(subject) || { total: 0, count: 0 };
      subjectMap.set(subject, { 
        total: existing.total + ((sub.grade / a.maxMarks) * 100), 
        count: existing.count + 1 
      });
    }
  });

  const subjects = Array.from(subjectMap.entries()).map(([name, data]) => ({
    subject: name,
    score: Math.round(data.total / data.count),
    fullMark: 100
  }));

  // Fallback if no real assignments completed yet
  if (subjects.length === 0) {
    subjects.push(
      { subject: "General", score: 0, fullMark: 100 }
    );
  }

  // Generated Historical Data
  const masteryHistory = useMemo(() => generateHistoricalData(overallMastery, 6, 8), [overallMastery]);
  
  const pointsHistory = useMemo(() => {
    const data = [];
    const weeks = ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "This Wk"];
    let remaining = currentPoints;
    for (let i = 5; i >= 0; i--) {
      if (i === 0) {
        data.unshift({ name: weeks[i], points: remaining });
      } else {
        const amt = Math.floor(remaining / (i + 1)) + Math.floor(Math.random() * 50 - 25);
        remaining -= amt;
        data.unshift({ name: weeks[i], points: amt });
      }
    }
    return data;
  }, [currentPoints]);

  const recentAchievements = [
    { title: "Algebra Master", desc: "Completed 5 assignments in a row", icon: Target, color: "text-[#5B5CFF]", bg: "bg-[#5B5CFF]/10" },
    { title: "7 Day Streak", desc: "Logged in and studied every day", icon: Flame, color: "text-[#EF4444]", bg: "bg-[#EF4444]/10" },
    { title: "Top 10%", desc: "In the overall leaderboard", icon: Award, color: "text-[#FB923C]", bg: "bg-[#FB923C]/10" },
  ];

  if (!mounted || !currentUser) return null;

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-[#5B5CFF]" />
              Performance Analytics
            </h1>
            <p className="text-sm text-[#B6C2D9]">Deep dive into your historical mastery and points progression.</p>
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.1] rounded-[12px] text-sm text-white hover:bg-white/[0.08] transition-colors">
              <Calendar className="w-4 h-4 text-[#7B8798]" />
              Last 6 Months
              <ChevronDown className="w-4 h-4 text-[#7B8798]" />
            </button>
          </div>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Trend Chart - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={itemVariants}>
              <GlassCard className="p-6 h-[400px] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 blur-[100px] rounded-full pointer-events-none bg-[#5B5CFF]/5"></div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-1">Overall Mastery Trend</h2>
                    <p className="text-xs text-[#7B8798]">Track your improvement over time</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-white block">{overallMastery}%</span>
                    <span className="text-xs text-[#22C55E] font-medium">+{(overallMastery - masteryHistory[masteryHistory.length - 2].value)}% from last month</span>
                  </div>
                </div>

                <div className="flex-1 w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={masteryHistory} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMastery" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5B5CFF" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#5B5CFF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#7B8798" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7B8798" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
                      <Tooltip content={<CustomAreaTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#5B5CFF" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorMastery)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>

            {/* Points Bar Chart & Alerts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Points Chart */}
              <motion.div variants={itemVariants}>
                <GlassCard className="p-6 h-[300px] flex flex-col">
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-1">Points Accumulation</h2>
                    <p className="text-xs text-[#7B8798]">Total points: <strong className="text-[#2DD4BF]">{currentPoints}</strong></p>
                  </div>
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pointsHistory} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#7B8798" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#7B8798" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="points" radius={[4, 4, 0, 0]} animationDuration={1500}>
                          {pointsHistory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === pointsHistory.length - 1 ? "#2DD4BF" : "rgba(45,212,191,0.4)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Actionable Alerts */}
              <motion.div variants={itemVariants} className="space-y-4">
                <GlassCard className="p-5 h-full">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#EAB308]" />
                    AI Action Items
                  </h3>
                  
                  <div className="space-y-3">
                    {weakTopics.length > 0 ? weakTopics.slice(0,2).map((topic: string, i: number) => (
                      <div key={i} className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-[12px] flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-semibold text-white mb-0.5">Struggling with {topic}</h4>
                          <p className="text-[11px] text-[#B6C2D9]">Your mastery dropped below 50%. Recommend taking a remedial quiz.</p>
                        </div>
                      </div>
                    )) : (
                      <div className="p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-[12px] flex items-start gap-3">
                        <Target className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-semibold text-white mb-0.5">All Clear!</h4>
                          <p className="text-[11px] text-[#B6C2D9]">You don't have any weak topics right now. Keep pushing forward!</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-3 bg-white/[0.04] border border-white/[0.08] rounded-[12px] flex items-start gap-3">
                      <BookOpen className="w-4 h-4 text-[#5B5CFF] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-white mb-0.5">Upcoming Deadline</h4>
                        <p className="text-[11px] text-[#B6C2D9]">Science Assignment is due in 2 days. Completing it early yields +50 bonus points.</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Subject Mastery Radar */}
            <motion.div variants={itemVariants}>
              <GlassCard className="p-6 h-[400px] flex flex-col">
                <div className="mb-2">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-1">Subject Profile</h2>
                  <p className="text-xs text-[#7B8798]">Balance across curriculum</p>
                </div>
                
                <div className="flex-1 w-full relative -mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={subjects}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#B6C2D9', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Mastery" dataKey="score" stroke="#8B5CF6" strokeWidth={2} fill="#8B5CF6" fillOpacity={0.4} animationDuration={1500} />
                      <Tooltip content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#07111F]/90 backdrop-blur-md border border-[#8B5CF6]/30 px-3 py-2 rounded-[8px]">
                              <span className="text-white font-semibold text-sm">{payload[0].payload.subject}: </span>
                              <span className="text-[#8B5CF6] font-bold text-sm">{payload[0].value}%</span>
                            </div>
                          )
                        }
                        return null;
                      }}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>

            {/* Achievements Sidebar */}
            <motion.div variants={itemVariants}>
              <GlassCard className="p-6">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#FB923C]" />
                  Recent Badges
                </h3>
                <div className="space-y-4">
                  {recentAchievements.map((ach, i) => {
                    const Icon = ach.icon;
                    return (
                      <div key={ach.title} className="flex items-center gap-4 group">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", ach.bg)}>
                          <Icon className={cn("w-6 h-6", ach.color)} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white text-sm mb-0.5">{ach.title}</h4>
                          <p className="text-[12px] text-[#7B8798] leading-tight">{ach.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
