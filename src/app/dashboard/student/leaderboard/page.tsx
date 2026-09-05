"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, TrendingUp, Users, Crown } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import { LeaderboardPodium } from "@/components/ui/LeaderboardPodium";
import { useLeaderboardStore } from "@/store/leaderboardStore";
import { useAuthStore } from "@/store/authStore";
import { CLASSES } from "@/data/curriculum-index";
import type { LeaderboardEntry } from "@/types/homework-types";

export default function LeaderboardPage() {
  const { entries, initializeLeaderboard, getLeaderboard, _hasHydrated, isInitialized } = useLeaderboardStore();
  const { currentUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [classFilter, setClassFilter] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (_hasHydrated) setMounted(true);
  }, [_hasHydrated]);

  useEffect(() => {
    if (mounted) {
      if (!isInitialized) {
        initializeLeaderboard();
      } else {
        setLeaderboard(getLeaderboard(classFilter ? `class-${classFilter}` : undefined));
      }
    }
  }, [mounted, classFilter, isInitialized, initializeLeaderboard, getLeaderboard, entries]);

  if (!mounted) return null;

  const rest = leaderboard.filter(s => s.rank > 3);

  return (
    <DashboardLayout role={currentUser?.role as "teacher" | "student"}>
      <div className="max-w-5xl mx-auto space-y-8 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-[#EAB308]" />
              School Leaderboard
            </h1>
            <p className="text-[#B6C2D9] mt-2">Global rankings based on homework completion and accuracy.</p>
          </div>
          <div className="flex gap-2">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#5B5CFF]/50"
            >
              <option value="">All Classes</option>
              {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
        </div>

        {/* Podium */}
        <LeaderboardPodium leaderboard={leaderboard} />

        {/* List */}
        <div className="space-y-3">
          {rest.map((student, idx) => (
            <motion.div
              key={student.studentId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx, type: "spring", stiffness: 100 }}
              className="relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#5B5CFF]/10 to-[#EAB308]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              
              <div className="p-1 rounded-2xl bg-gradient-to-r from-white/[0.05] to-white/[0.01] hover:from-[#5B5CFF]/20 hover:to-[#EAB308]/20 transition-all duration-200">
                <GlassCard className="p-4 md:p-5 flex items-center gap-4 md:gap-6 bg-[#0B1527] border-none rounded-xl">
                  
                  <div className="w-12 h-12 flex items-center justify-center font-black text-[#B6C2D9] text-xl md:text-2xl opacity-60 relative">
                    <span className="absolute text-[40px] opacity-10 blur-[2px] font-serif italic text-white/50">{student.rank}</span>
                    <span className="relative z-10">#{student.rank}</span>
                  </div>
                  
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full p-[2px] bg-gradient-to-br from-white/20 to-white/5 group-hover:from-[#5B5CFF] group-hover:to-[#EAB308] transition-colors duration-500 shadow-lg shrink-0">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#131D2E] to-[#07111F] flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                      {student.avatar && student.avatar.length > 10 ? (
                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                      ) : student.avatar ? (
                        <span className="text-sm font-bold text-white">{student.avatar}</span>
                      ) : (
                        <span className="bg-clip-text text-transparent bg-gradient-to-br from-white to-[#B6C2D9]">
                          {(student.name || "ST").substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg md:text-xl truncate group-hover:text-[#EAB308] transition-colors">{student.name || "Unknown Student"}</h3>
                    <p className="text-white/50 text-xs mt-0.5">Class {student.class || "-"}</p>
                    <div className="flex items-center gap-3 md:gap-5 mt-1">
                      <span className="text-[11px] md:text-xs font-semibold text-[#7B8798] flex items-center gap-1.5 uppercase tracking-wider">
                        <TrendingUp className="w-3.5 h-3.5 text-[#5B5CFF]" /> {student.homeworkCount} <span className="hidden sm:inline">Assignments</span><span className="sm:hidden">HW</span>
                      </span>
                      <span className="text-[11px] md:text-xs font-semibold text-[#7B8798] flex items-center gap-1.5 uppercase tracking-wider">
                        <Star className="w-3.5 h-3.5 text-[#EAB308]" /> {student.streak} Streak
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right pl-4 border-l border-white/5">
                    <div className="text-[#EAB308] font-black text-2xl md:text-3xl drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">{student.points}</div>
                    <div className="text-[10px] md:text-xs text-[#7B8798] uppercase tracking-[0.2em] font-bold">Points</div>
                  </div>
                  
                </GlassCard>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

