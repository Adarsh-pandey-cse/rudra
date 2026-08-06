"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useNoticeStore } from "@/store/noticeStore";
import { NOTICE_TYPE_INFO } from "@/types/notice-types";
import type { Student } from "@/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { Megaphone, Bell, Pin, Search, BellOff } from "lucide-react";
import SmartNoticeCard from "@/components/notices/SmartNoticeCard";

const containerVariants: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants: any = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

export default function StudentNoticesPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const { getStudentNotices, getUnreadCount, markAsRead, acknowledgeNotice } = useNoticeStore();

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "student") {
      router.replace("/auth/login");
      return;
    }
    setMounted(true);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  if (!mounted || !currentUser) return null;

  const student = currentUser as Student;
  const classId = student.classId;

  const relevantNotices = getStudentNotices(student.id, classId);

  const filteredNotices = relevantNotices.filter((n) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!n.title.toLowerCase().includes(q) && !n.body.toLowerCase().includes(q) && !(n.teacherName || "").toLowerCase().includes(q)) {
        return false;
      }
    }

    if (activeFilter === "All") return true;
    if (activeFilter === "Important") return n.priority === "high" || n.priority === "critical";
    if (activeFilter === "Homework") return n.type === "homework";
    if (activeFilter === "Holiday") return n.type === "holiday";
    if (activeFilter === "More") return !["homework", "holiday"].includes(n.type) && n.priority !== "high" && n.priority !== "critical";
    return true;
  });

  const pinnedNotices = filteredNotices.filter(n => n.isPinned);
  const regularNotices = filteredNotices.filter(n => !n.isPinned);
  const unreadCount = getUnreadCount(student.id, classId);

  const handleAcknowledge = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    acknowledgeNotice(id, student.id);
  };

  const filters = ["All", "Important", "Homework", "Holiday", "More"];



  return (
    <DashboardLayout role="student">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Megaphone className="w-6 h-6 text-[#5B5CFF]" />
              Notices
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-[#5B5CFF]/20 text-[#5B5CFF] text-xs rounded-full font-medium border border-[#5B5CFF]/30">
                  {unreadCount} New
                </span>
              )}
            </h1>
            <p className="text-sm text-[#B6C2D9]">Stay updated with school announcements</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-[28px]">
            <Bell size={24} className={unreadCount > 0 ? "text-[#5B5CFF] animate-pulse" : "text-[#7B8798]"} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7B8798]" />
            <input 
              type="text"
              placeholder="Search notices by title, keyword, or author..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#7B8798] focus:outline-none focus:ring-2 focus:ring-[#5B5CFF]/50 transition-all"
            />
          </div>

          <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                  activeFilter === f 
                    ? "bg-white/10 text-white shadow-lg backdrop-blur-md border-white/20" 
                    : "bg-white/5 text-[#7B8798] hover:bg-white/10 hover:text-[#B6C2D9] border-transparent"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show"
          className="space-y-6"
        >
          {pinnedNotices.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-[11px] font-semibold text-[#FB923C] uppercase tracking-wider flex items-center gap-2">
                <Pin size={14} /> Pinned Notices
              </h2>
              <div className="space-y-3">
                {pinnedNotices.map(notice => (
                  <motion.div key={notice.id} variants={itemVariants}>
                    <SmartNoticeCard 
                      notice={notice} 
                      isPinned 
                      onAcknowledge={handleAcknowledge}
                      hasAcknowledged={(notice as any).acknowledgedBy?.includes(student.id)}
                      requiresAck={(notice as any).requiresAcknowledgment}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {pinnedNotices.length > 0 && regularNotices.length > 0 && (
              <h2 className="text-[11px] font-semibold text-[#7B8798] uppercase tracking-wider mt-4">
                Recent Notices
              </h2>
            )}
            
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {regularNotices.map(notice => (
                  <motion.div key={notice.id} variants={itemVariants}>
                    <SmartNoticeCard 
                      notice={notice} 
                      onAcknowledge={handleAcknowledge}
                      hasAcknowledged={(notice as any).acknowledgedBy?.includes(student.id)}
                      requiresAck={(notice as any).requiresAcknowledgment}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredNotices.length === 0 && (
              <motion.div variants={itemVariants} className="pt-8">
                <EmptyState 
                  icon={<BellOff className="w-12 h-12 text-[#7B8798]" />}
                  title="No notices found"
                  description={`You're all caught up! There are no ${activeFilter.toLowerCase()} notices to show at the moment.`}
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
