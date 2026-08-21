"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, TrendingUp, Users, Crown } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
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

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Podium order: 2nd, 1st, 3rd
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);

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
        {leaderboard.length >= 3 ? (
          <div className="flex justify-center items-end gap-2 md:gap-6 pt-12 pb-8">
            {podium.map((student, idx) => {
              const isFirst = student === top3[0];
              const isSecond = student === top3[1];
              const isThird = student === top3[2];
              
              const height = isFirst ? "h-48" : isSecond ? "h-36" : "h-28";
              const colors = isFirst 
                ? "from-[#EAB308]/20 to-[#EAB308]/5 border-[#EAB308]/50" 
                : isSecond 
                  ? "from-[#94A3B8]/20 to-[#94A3B8]/5 border-[#94A3B8]/50"
                  : "from-[#B45309]/20 to-[#B45309]/5 border-[#B45309]/50";

              return (
                <motion.div 
                  key={student.studentId}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: isFirst ? 0 : isSecond ? 0.2 : 0.4, type: "spring" }}
                  className="flex flex-col items-center relative"
                >
                  {isFirst && (
                    <Crown className="w-8 h-8 text-[#EAB308] absolute -top-12 animate-bounce" />
                  )}
                  <div className="relative mb-4 z-10">
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 flex items-center justify-center bg-gradient-to-br from-[#0D1929] to-[#07111F] text-xl font-bold text-white shadow-2xl ${
                      isFirst ? "border-[#EAB308]" : isSecond ? "border-[#94A3B8]" : "border-[#B45309]"
                    }`}>
                      {student.avatar && student.avatar.length > 10 ? (
                        <img src={student.avatar} alt={student.name || "Student"} className="w-full h-full rounded-full object-cover" />
                      ) : student.avatar ? (
                        <span className="text-sm md:text-xl font-bold text-white">{student.avatar}</span>
                      ) : (
                        (student.name || "S").substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#07111F] ${
                      isFirst ? "bg-[#EAB308] text-black" : isSecond ? "bg-[#94A3B8] text-black" : "bg-[#B45309] text-white"
                    }`}>
                      #{isFirst ? "1" : isSecond ? "2" : "3"}
                    </div>
                  </div>
                  
                  <div className={`w-24 md:w-32 ${height} rounded-t-2xl bg-gradient-to-b ${colors} border-t-2 border-x border-white/0 backdrop-blur-sm flex flex-col items-center pt-4 shadow-[0_0_30px_rgba(0,0,0,0.3)]`}>
                    <p className="text-white font-bold text-center text-sm md:text-base px-2 truncate w-full">{student.name}</p>
                    <p className="text-white/50 text-[10px] md:text-xs">Class {student.class || "-"}</p>
                    <p className="text-[#EAB308] font-bold text-sm md:text-lg mt-1">{student.points}</p>
                    <p className="text-[10px] text-[#7B8798] uppercase tracking-wider">Points</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-[#7B8798]">Not enough students for a podium yet.</div>
        )}

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

