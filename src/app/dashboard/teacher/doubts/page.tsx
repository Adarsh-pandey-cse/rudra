"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { MessageCircle, ChevronRight, Filter, Star } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { useAuthStore } from "@/store/authStore";
import { useDoubtStore } from "@/store/doubtStore";
import { cn } from "@/lib/utils";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function DoubtsPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const { getTeacherAllDoubts } = useDoubtStore();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("open");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      // router.replace("/auth/login"); /* Handled by DashboardLayout */
      return;
    }
    setMounted(true);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  if (!mounted || !currentUser) return null;

  const doubts = getTeacherAllDoubts();

  const filteredDoubts = doubts.filter(d => {
    if (activeTab === 'all') return true;
    if (activeTab === 'open') return d.status !== 'resolved';
    return d.status === activeTab;
  });

  const getPriorityVariant = (priority: string): "error" | "warning" | "success" | "default" => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusVariant = (status: string): "warning" | "success" | "default" => {
    switch (status) {
      case 'open': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-8">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#4F9DFF]/10 text-[#4F9DFF] border border-[#4F9DFF]/20 shadow-[0_0_15px_rgba(79,157,255,0.1)]">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Student Doubts</h1>
              <p className="text-sm text-[#7B8798] mt-1">Resolve and manage student queries</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="flex items-center gap-3 bg-white/[0.02] p-2 rounded-[18px] border border-white/[0.05] w-fit">
          <div className="pl-3 pr-1 text-[#7B8798]">
            <Filter className="w-4 h-4" />
          </div>
          <div className="flex gap-1">
            {["open", "resolved", "all"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-5 py-2 rounded-[14px] text-sm font-medium transition-all capitalize",
                  activeTab === tab
                    ? "bg-white/[0.1] text-white shadow-sm"
                    : "text-[#7B8798] hover:text-[#B6C2D9] hover:bg-white/[0.06]"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Doubts List */}
        {filteredDoubts.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredDoubts.map((doubt) => (
                <motion.div 
                  key={doubt.id} 
                  variants={itemVariants} 
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <GlassCard 
                    hoverEffect 
                    className="p-4 sm:p-5 cursor-pointer group" 
                    onClick={() => router.push(`/dashboard/teacher/doubts/${doubt.id}`)}
                  >
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                      {/* Left/Top Section: Avatar and Content */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0 shadow-[0_0_15px_rgba(91,92,255,0.2)] group-hover:scale-105 transition-transform">
                          {doubt.studentName.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1 sm:mb-2">
                            <span className="font-semibold text-white text-base truncate">{doubt.studentName}</span>
                            <div className="hidden sm:block w-1 h-1 rounded-full bg-[#7B8798]" />
                            <span className="text-[12px] sm:text-[13px] font-medium text-[#7B8798] bg-white/5 sm:bg-transparent px-2 py-0.5 sm:p-0 rounded-md">Class {doubt.classId}</span>
                          </div>
                          <p className="text-sm text-[#B6C2D9] line-clamp-2 sm:line-clamp-1 group-hover:text-white transition-colors leading-relaxed">{doubt.question}</p>
                        </div>
                      </div>

                      {/* Right/Bottom Section: Badges & Action */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 sm:h-full pt-3 sm:pt-0 border-t border-white/[0.04] sm:border-0 mt-1 sm:mt-0">
                        <div className="flex gap-2">
                          <StatusBadge variant={getPriorityVariant(doubt.priority)} className="uppercase text-[10px] sm:text-[11px] px-2 sm:px-2.5">
                            {doubt.priority}
                          </StatusBadge>
                          <StatusBadge variant={getStatusVariant(doubt.status)} className="uppercase text-[10px] sm:text-[11px] px-2 sm:px-2.5">
                            {doubt.status}
                          </StatusBadge>
                          {doubt.studentRating && (
                            <div className="flex items-center gap-1 bg-gradient-to-r from-[#FBBF24]/20 to-[#F59E0B]/10 border border-[#FBBF24]/30 px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.15)]">
                              <Star className="w-3 h-3 fill-[#FBBF24] text-[#FBBF24] drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                              <span className="text-[#FBBF24] text-[11px] font-bold tracking-wider">{doubt.studentRating / 2}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[#7B8798] group-hover:text-[#5B5CFF] transition-colors ml-auto sm:ml-0 mt-auto">
                          <span className="text-[12px] sm:text-[13px] font-medium hidden sm:inline-block">Quick Reply</span>
                          <span className="text-[12px] font-medium sm:hidden">Reply</span>
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/[0.04] flex items-center justify-center group-hover:bg-[#5B5CFF]/10 transition-colors">
                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} initial="hidden" animate="show">
            <EmptyState
              icon={<MessageCircle className="w-12 h-12 text-[#7B8798]" />}
              title="No doubts found"
              description={`There are currently no ${activeTab === 'all' ? '' : activeTab} doubts in this category.`}
            />
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
