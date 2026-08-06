"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { 
  BarChart, TrendingUp, IndianRupee, BookOpen, 
  Users, Target, Bot, Sparkles 
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";

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

export default function TeacherAnalyticsPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      router.replace("/auth/login");
      return;
    }
    setMounted(true);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  if (!mounted || !currentUser) return null;

  // Mock Analytics Data
  const revenueData = [
    { month: "Jan", expected: 50000, collected: 48000 },
    { month: "Feb", expected: 50000, collected: 45000 },
    { month: "Mar", expected: 52000, collected: 50000 },
    { month: "Apr", expected: 55000, collected: 52000 },
    { month: "May", expected: 55000, collected: 54000 },
    { month: "Jun", expected: 60000, collected: 58000 },
  ];
  const maxRevenue = 65000;

  const homeworkData = [
    { subject: "Math", submitted: 85, late: 10, pending: 5 },
    { subject: "Science", submitted: 75, late: 15, pending: 10 },
    { subject: "English", submitted: 90, late: 5, pending: 5 },
  ];

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
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <div className="p-2 bg-[#5B5CFF]/20 rounded-xl">
              <BarChart className="w-6 h-6 text-[#5B5CFF]" />
            </div>
            Analytics Hub
          </h1>
          <p className="text-sm text-[#B6C2D9]">Deep insights into revenue and academic performance.</p>
        </motion.div>

        {/* AI Insights Panel */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-6 border-[#8B5CF6]/30 bg-gradient-to-br from-[#8B5CF6]/10 to-[#5B5CFF]/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-[#8B5CF6]/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#8B5CF6]" />
                Rudra AI Insights
                <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-[14px] bg-white/[0.04] border border-white/[0.05] border-l-4 border-l-[#22C55E]">
                  <p className="text-sm font-medium text-white">Revenue is up <span className="text-[#22C55E] font-bold">14%</span> compared to last quarter.</p>
                  <p className="text-[13px] text-[#7B8798] mt-1">Driven by 5 new admissions in Class 9.</p>
                </div>
                <div className="p-4 rounded-[14px] bg-white/[0.04] border border-white/[0.05] border-l-4 border-l-[#FB923C]">
                  <p className="text-sm font-medium text-white">Science homework submission dropped by <span className="text-[#FB923C] font-bold">12%</span>.</p>
                  <p className="text-[13px] text-[#7B8798] mt-1">Consider reducing assignment difficulty.</p>
                </div>
                <div className="p-4 rounded-[14px] bg-white/[0.04] border border-white/[0.05] border-l-4 border-l-[#EF4444]">
                  <p className="text-sm font-medium text-white">3 students are consistently paying late.</p>
                  <p className="text-[13px] text-[#7B8798] mt-1">Review Fee profiles for Adarsh, Rahul, Sneha.</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Revenue Trend Chart (CSS based) */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <GlassCard className="p-6 h-full">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#22C55E]" />
                  6-Month Revenue Trend
                </h3>
                <div className="flex items-center gap-4 text-[11px] font-medium text-[#7B8798] uppercase tracking-wider">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white/[0.06] border border-white/[0.08]"></span> Expected</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#22C55E]"></span> Collected</div>
                </div>
              </div>

              <div className="relative h-64 flex items-end justify-between gap-2 mt-4 px-2">
                {/* Y-Axis Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                  {[4, 3, 2, 1, 0].map(line => (
                    <div key={line} className="w-full border-b border-white/[0.04] relative">
                      <span className="absolute -top-2.5 -left-12 text-[11px] text-[#7B8798] font-mono">
                        {(maxRevenue * (line / 4) / 1000)}k
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bars */}
                {revenueData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 relative z-10 group h-full justify-end pb-6">
                    <div className="flex gap-1.5 w-full h-full items-end justify-center px-1 sm:px-4">
                      {/* Expected Bar */}
                      <motion.div 
                        initial={{ height: 0 }} animate={{ height: `${(data.expected / maxRevenue) * 100}%` }}
                        transition={{ delay: i * 0.1, type: "spring" }}
                        className="w-1/2 max-w-[24px] bg-white/[0.06] border border-white/[0.08] border-b-0 rounded-t-md relative group-hover:bg-white/[0.1] transition-colors"
                      />
                      {/* Collected Bar */}
                      <motion.div 
                        initial={{ height: 0 }} animate={{ height: `${(data.collected / maxRevenue) * 100}%` }}
                        transition={{ delay: i * 0.1 + 0.2, type: "spring" }}
                        className="w-1/2 max-w-[24px] bg-gradient-to-t from-[#22C55E] to-[#4ade80] rounded-t-md relative shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                      />
                    </div>
                    <span className="text-[11px] text-[#7B8798] uppercase tracking-wider font-medium absolute bottom-0">{data.month}</span>
                    
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#131D2E] border border-white/[0.08] rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap shadow-xl">
                      <p className="text-[11px] text-[#7B8798] uppercase tracking-wider font-medium mb-1">{data.month} Revenue</p>
                      <p className="text-[13px] font-bold text-white">Exp: ₹{data.expected.toLocaleString()}</p>
                      <p className="text-[13px] font-bold text-[#22C55E]">Col: ₹{data.collected.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Homework Submission Breakdown */}
          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 h-full">
              <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#4F9DFF]" />
                Submission Rates
              </h3>
              
              <div className="space-y-6">
                {homeworkData.map((data, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-white">{data.subject}</span>
                      <span className="text-[13px] text-[#7B8798]">{data.submitted}% On Time</span>
                    </div>
                    
                    {/* Stacked Progress Bar */}
                    <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden flex">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${data.submitted}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                        className="h-full bg-[#22C55E]" title="Submitted On Time"
                      />
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${data.late}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                        className="h-full bg-[#FB923C]" title="Submitted Late"
                      />
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${data.pending}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                        className="h-full bg-[#EF4444]" title="Pending"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 text-[13px] text-[#B6C2D9]">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#22C55E]"></span> Submitted On Time</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#FB923C]"></span> Submitted Late</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#EF4444]"></span> Pending / Not Submitted</div>
              </div>
            </GlassCard>
          </motion.div>

        </div>
      </motion.div>
    </DashboardLayout>
  );
}
