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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
            >
              <GlassCard className="p-4 flex items-center gap-4 hover:bg-white/[0.04] transition-colors">
                <div className="w-10 text-center font-bold text-[#7B8798] text-lg">
                  #{student.rank}
                </div>
                
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] flex items-center justify-center text-white font-bold shadow-lg">
                  {student.avatar && student.avatar.length > 10 ? (
                    <img src={student.avatar} alt={student.name || "Student"} className="w-full h-full rounded-full object-cover" />
                  ) : student.avatar ? (
                    <span className="text-sm font-bold text-white">{student.avatar}</span>
                  ) : (
                    (student.name || "S").substring(0, 2).toUpperCase()
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg md:text-xl truncate group-hover:text-[#EAB308] transition-colors">{student.name}</h3>
                    <p className="text-white/50 text-xs mt-0.5">Class {student.class || "-"}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-[#7B8798] flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-[#22C55E]" /> {student.homeworkCount} HW
                    </span>
                    <span className="text-xs text-[#7B8798] flex items-center gap-1">
                      <Star className="w-3 h-3 text-[#EAB308]" /> {student.streak} Streak
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-[#EAB308] font-bold text-lg">{student.points}</div>
                  <div className="text-[10px] text-[#7B8798] uppercase tracking-wider">Points</div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

