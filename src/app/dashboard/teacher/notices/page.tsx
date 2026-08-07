"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Megaphone, Plus, Search, Pin, PinOff, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import EmptyState from "@/components/ui/EmptyState";
import { useAuthStore } from "@/store/authStore";
import { useNoticeStore } from "@/store/noticeStore";
import { cn } from "@/lib/utils";
import SmartNoticeCard from "@/components/notices/SmartNoticeCard";

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

export default function NoticesPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const { getTeacherNotices, pinNotice, deleteNotice } = useNoticeStore();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      router.replace("/auth/login");
      return;
    }
    setMounted(true);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  if (!mounted || !currentUser) return null;

  const notices = getTeacherNotices(currentUser.id);
  const filteredNotices = notices.filter(notice => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!notice.title.toLowerCase().includes(q) && !notice.body.toLowerCase().includes(q)) {
        return false;
      }
    }

    if (activeTab === "All") return true;
    if (activeTab === "Important") return notice.priority === "high" || notice.priority === "critical";
    if (activeTab === "Homework") return notice.type === "homework";
    if (activeTab === "Holiday") return notice.type === "holiday";
    if (activeTab === "More") return !["homework", "holiday"].includes(notice.type) && notice.priority !== "high" && notice.priority !== "critical";
    return true; 
  });

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-8">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#FB923C]/10 text-[#FB923C] border border-[#FB923C]/20 shadow-[0_0_15px_rgba(251,146,60,0.1)]">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Notice Board</h1>
              <p className="text-sm text-[#7B8798] mt-1">Broadcast important announcements</p>
            </div>
          </motion.div>
          <motion.div variants={itemVariants}>
            <GradientButton onClick={() => router.push("/dashboard/teacher/notices/create")} className="flex items-center gap-2">
              <Plus className="w-5 h-5" /> New Notice
            </GradientButton>
          </motion.div>
        </motion.div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7B8798]" />
            <input 
              type="text"
              placeholder="Search notices..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#7B8798] focus:outline-none focus:ring-2 focus:ring-[#FB923C]/50 transition-all"
            />
          </div>

          <motion.div variants={itemVariants} initial="hidden" animate="show" className="flex flex-wrap gap-3">
            {["All", "Important", "Homework", "Holiday", "More"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-[14px] text-sm font-medium transition-all capitalize",
                  activeTab === tab
                    ? "bg-white/[0.1] text-white border border-white/[0.16] shadow-sm"
                    : "text-[#7B8798] hover:text-[#B6C2D9] hover:bg-white/[0.06] border border-transparent"
                )}
              >
                {tab}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Notices List */}
        {filteredNotices.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredNotices.map((notice, idx) => (
                <motion.div 
                  key={`${notice.id}-${idx}`} 
                  variants={itemVariants} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="relative group"
                >
                  {/* Teacher Quick Actions Overlay */}
                  <div className="absolute -right-2 -top-2 z-50 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); pinNotice(notice.id, !notice.isPinned); }}
                      className={cn(
                        "p-2 rounded-full shadow-lg border backdrop-blur-md", 
                        notice.isPinned 
                          ? "bg-[#FB923C] text-white border-[#FB923C]" 
                          : "bg-black/60 text-white hover:bg-[#FB923C] hover:border-[#FB923C] border-white/20"
                      )}
                      aria-label={notice.isPinned ? "Unpin notice" : "Pin notice"}
                    >
                      {notice.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if(confirm('Are you sure you want to delete this notice?')) {
                          deleteNotice(notice.id);
                        }
                      }}
                      className="p-2 rounded-full shadow-lg border backdrop-blur-md bg-black/60 text-white hover:bg-[#EF4444] hover:border-[#EF4444] border-white/20"
                      aria-label="Delete notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <SmartNoticeCard 
                    notice={notice} 
                    isPinned={notice.isPinned}
                  />
                  
                  {/* Read Receipts */}
                  {(notice as any).requiresAcknowledgment && (
                    <div className="mt-2 text-xs text-right text-[#7B8798] font-medium pr-2">
                      Acknowledged by {(notice as any).acknowledgedBy?.length || 0} students
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} initial="hidden" animate="show">
            <EmptyState
              icon={<Megaphone className="w-12 h-12 text-[#7B8798]" />}
              title="No notices found"
              description="There are currently no notices matching your filter."
              action={
                <GradientButton onClick={() => router.push("/dashboard/teacher/notices/create")}>
                  New Notice
                </GradientButton>
              }
            />
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
