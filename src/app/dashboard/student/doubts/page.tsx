"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useDoubtStore } from "@/store/doubtStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import type { Doubt, DoubtStatus as StoreDoubtStatus } from "@/types/doubt-types";
import Link from "next/link";
import { 
  Plus, 
  MessageCircleQuestion, 
  BookOpen, 
  Star, 
  Clock, 
  CheckCircle2, 
  Bot, 
  User,
  RefreshCw,
  ArrowLeft,
  Filter,
  SlidersHorizontal,
  Camera,
  Image as ImageIcon
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

const containerVariants: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants: any = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

type DoubtStatus = "open" | "ai_answered" | "escalated" | "teacher_answered" | "resolved" | "reopened";

export default function StudentDoubtsPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const { doubts } = useDoubtStore();
  
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "student") {
      // router.replace("/auth/login"); /* Handled by DashboardLayout */
      return;
    }
    setMounted(true);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  if (!mounted || !currentUser) return null;

  const myDoubts = doubts.filter(d => d.studentId === currentUser.id);
  
  const filteredDoubts = myDoubts.filter(d => {
    if (activeTab === "All") return true;
    if (activeTab === "Open") return d.status === "open" || d.status === "reopened" || d.status === "escalated";
    if (activeTab === "Resolved") return d.status === "resolved";
    return true;
  });

  const totalDoubts = myDoubts.length;
  const resolvedDoubts = myDoubts.filter(d => d.status === "resolved").length;
  const pendingDoubts = totalDoubts - resolvedDoubts;

  const tabs = ["All", "Open", "Resolved"];

  return (
    <DashboardLayout role="student">
      <div className="max-w-5xl mx-auto pb-24 space-y-6 relative min-h-[80vh] px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.10] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-white">Doubt Hub</h1>
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[#B6C2D9] hover:bg-white/[0.10] transition-colors">
              <Filter className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[#B6C2D9] hover:bg-white/[0.10] transition-colors">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap
                ${activeTab === tab 
                  ? "bg-[#5B5CFF] text-white shadow-[0_0_20px_rgba(91,92,255,0.3)]" 
                  : "bg-white/[0.06] border border-white/[0.08] text-[#B6C2D9] hover:bg-white/[0.10]"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Upload Area */}
        <Link href="/dashboard/student/doubts/ask" className="block">
          <GlassCard className="p-5 flex flex-col sm:flex-row items-center gap-4 hover:bg-white/[0.10] cursor-pointer transition-colors group">
            <div className="flex-1 w-full relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Plus className="w-5 h-5 text-[#7B8798] group-hover:text-[#5B5CFF] transition-colors" />
              </div>
              <div className="w-full h-12 bg-black/20 rounded-[14px] border border-white/[0.08] flex items-center px-12 text-sm text-[#7B8798] group-hover:border-[#5B5CFF]/30 transition-colors">
                Type Your Question...
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto px-2">
              <div className="h-[1px] flex-1 bg-white/[0.08] sm:hidden" />
              <span className="text-[11px] text-[#7B8798] uppercase tracking-wider font-medium shrink-0">OR</span>
              <div className="h-[1px] flex-1 bg-white/[0.08] sm:hidden" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-[14px] bg-white/[0.06] border border-white/[0.08] text-sm text-white font-medium hover:bg-white/[0.10] transition-colors">
                <Camera className="w-4 h-4 text-[#4F9DFF]" />
                Photo
              </button>
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-[14px] bg-white/[0.06] border border-white/[0.08] text-sm text-white font-medium hover:bg-white/[0.10] transition-colors">
                <ImageIcon className="w-4 h-4 text-[#2DD4BF]" />
                Gallery
              </button>
            </div>
          </GlassCard>
        </Link>

        {/* Doubts Grid */}
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {filteredDoubts.map(doubt => {
            const isResolved = doubt.status === "resolved";
            const isPending = doubt.status === "open" || doubt.status === "escalated";
            const isAIAnswered = doubt.status === "ai_answered";
            const statusVariant = isResolved ? "success" : isPending ? "warning" : isAIAnswered ? "info" : "error";
            const statusLabel = isResolved ? "Answered" : doubt.status === "reopened" ? "Reopened" : "Pending";
            
            return (
              <motion.div key={doubt.id} variants={itemVariants}>
                <Link href={`/dashboard/student/doubts/${doubt.id}`}>
                  <GlassCard className="h-full hover:bg-white/[0.10] transition-colors cursor-pointer flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <StatusBadge variant="default" className="bg-[#4F9DFF]/10 text-[#4F9DFF] border-[#4F9DFF]/20">
                        {doubt.subjectName}
                      </StatusBadge>
                      <StatusBadge variant={statusVariant} dot>
                        {statusLabel}
                      </StatusBadge>
                    </div>

                    <div className="flex-1 flex gap-4">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white line-clamp-2 leading-relaxed mb-2">
                          {doubt.question}
                        </h3>
                        {doubt.topicName && (
                          <span className="text-[13px] text-[#7B8798]">
                            Topic: {doubt.topicName}
                          </span>
                        )}
                      </div>
                      
                      {/* Attachment Thumbnail Placeholder if exists (Simulated) */}
                      {doubt.attachments && doubt.attachments.length > 0 && (
                        <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/[0.08] shrink-0 flex items-center justify-center overflow-hidden">
                           <ImageIcon className="w-6 h-6 text-[#7B8798]" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.08] text-[13px] text-[#7B8798]">
                      <span>{new Date(doubt.createdAt).toLocaleDateString()}</span>
                      {doubt.status === "resolved" && doubt.studentRating && (
                        <div className="flex gap-1 text-[#FB923C]">
                          {[...Array(doubt.studentRating / 2)].map((_, i) => <Star key={i} size={12} className="fill-current" />)}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {filteredDoubts.length === 0 && (
          <motion.div variants={itemVariants} initial="hidden" animate="show">
            <EmptyState 
              icon={<MessageCircleQuestion className="w-12 h-12" />}
              title="No doubts found"
              description="Looks like you're all clear! If you have any questions, feel free to ask."
            />
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
