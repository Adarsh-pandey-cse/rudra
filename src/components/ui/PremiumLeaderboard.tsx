"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Star, Crown, Flame } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLeaderboardStore } from "@/store/leaderboardStore";
import { useAuthStore } from "@/store/authStore";
import { CLASSES } from "@/data/curriculum-index";
import type { LeaderboardEntry } from "@/types/homework-types";

const CountUp = ({ value, duration = 1500 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // easeOutExpo
      const ease = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      setCount(Math.floor(ease * value));

      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count}</span>;
};

const Particles = () => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Check for reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    
    const generateParticles = () => {
      const colors = ['#F4C542', '#BFCBE0', '#B86B32', '#FFFFFF'];
      const newParticles = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 5,
        duration: Math.random() * 10 + 10
      }));
      setParticles(newParticles);
    };
    
    generateParticles();
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: `${p.x}vw`, y: `100vh` }}
          animate={{ 
            opacity: [0, 0.5, 0],
            y: `-20vh`,
            x: `${p.x + (Math.random() * 10 - 5)}vw` 
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear"
          }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`
          }}
        />
      ))}
    </div>
  );
};

export default function PremiumLeaderboard({ role }: { role: "teacher" | "student" }) {
  const { entries, initializeLeaderboard, getLeaderboard, isInitialized } = useLeaderboardStore();
  const { currentUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [classFilter, setClassFilter] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setMounted(true);
    if (!isInitialized) {
      initializeLeaderboard();
    }
  }, [initializeLeaderboard, isInitialized]);

  useEffect(() => {
    if (mounted) {
      const data = getLeaderboard(classFilter);
      if (data.length === 0 && classFilter === "" && entries.length > 0) {
        setLeaderboard(entries);
      } else {
        setLeaderboard(data);
      }
    }
  }, [mounted, classFilter, isInitialized, getLeaderboard, entries]);

  if (!mounted) {
    return (
      <DashboardLayout role={role}>
        <div className="min-h-screen bg-[#050B17] flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#F4C542]/20 border-t-[#F4C542] rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rank1 = top3[0];
  const rank2 = top3[1];
  const rank3 = top3[2];
  const rest = leaderboard.slice(3);

  const getAvatar = (student: any) => {
    if (!student) return null;
    if (student.avatar && student.avatar.length > 10) {
      return <img src={student.avatar} alt={student.name} className="w-full h-full rounded-full object-cover" />;
    }
    if (student.avatar) {
      return <span className="text-2xl font-bold">{student.avatar}</span>;
    }
    return <span className="text-2xl font-bold text-white">{(student.name || "S").substring(0, 2).toUpperCase()}</span>;
  };

  return (
    <DashboardLayout role={role}>
      <div className="min-h-screen bg-[#050D1A] relative overflow-hidden text-white font-sans selection:bg-[#F4C542]/30">
        
        {/* Cinematic Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Gold Glow */}
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#F4C542]/10 blur-[120px] rounded-full" />
          {/* Silver Glow */}
          <div className="absolute top-[30%] left-[20%] w-[600px] h-[600px] bg-[#8EA2BC]/10 blur-[100px] rounded-full" />
          {/* Bronze Glow */}
          <div className="absolute top-[30%] right-[20%] w-[600px] h-[600px] bg-[#B86B32]/10 blur-[100px] rounded-full" />
        </div>

        <Particles />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col gap-12 lg:gap-20">
          
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
          >
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Trophy className="w-10 h-10 text-[#F4C542] drop-shadow-[0_0_15px_rgba(244,197,66,0.5)]" />
                <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                  School Leaderboard
                </h1>
              </div>
              <p className="text-[#9AA8BC] text-lg lg:text-xl font-medium mt-2">
                Global rankings based on homework completion and accuracy.
              </p>
              <div className="mt-4 inline-block">
                <p className="text-[#F4C542] italic font-serif text-xl opacity-90">
                  "Small Efforts, Big Achievements!"
                </p>
                <div className="h-px w-full bg-gradient-to-r from-[#F4C542]/0 via-[#F4C542]/50 to-[#F4C542]/0 mt-2" />
              </div>
            </div>

            <div className="relative group w-full lg:w-auto z-50">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full lg:w-48 appearance-none bg-[#0A1424]/80 backdrop-blur-xl border border-white/10 hover:border-[#F4C542]/50 rounded-xl px-5 py-3.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F4C542]/50 transition-all cursor-pointer shadow-xl"
              >
                <option value="">👥 All Classes</option>
                {CLASSES.map(c => <option key={c} value={c}>📚 Class {c}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#9AA8BC] group-hover:text-[#F4C542] transition-colors">
                ▼
              </div>
            </div>
          </motion.div>

          {/* Empty State */}
          {leaderboard.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Trophy className="w-20 h-20 text-white/10 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-2">No rankings yet</h3>
              <p className="text-[#9AA8BC]">Complete your first homework to appear on the leaderboard.</p>
            </div>
          )}

          {/* Premium Podium */}
          {leaderboard.length > 0 && (
            <div className="relative pt-24 pb-12 lg:pt-32">
              
              <div className="flex flex-col lg:flex-row items-end justify-center gap-6 lg:gap-8 max-w-5xl mx-auto">
                
                {/* Mobile Rank 1 (Shows first on mobile, hidden on Desktop flex-row order) */}
                <div className="lg:hidden w-full flex justify-center mb-8">
                  {rank1 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                      className="relative w-[280px] flex flex-col items-center"
                    >
                      <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-16 z-20">
                        <Crown className="w-14 h-14 text-[#F4C542] drop-shadow-[0_0_20px_rgba(244,197,66,0.8)] fill-[#F4C542]" />
                      </motion.div>
                      <div className="relative z-10 w-32 h-32 rounded-full border-[4px] border-[#F4C542] bg-[#0A1424] shadow-[0_0_30px_rgba(244,197,66,0.4)] flex items-center justify-center mb-[-30px] overflow-hidden">
                        {getAvatar(rank1)}
                      </div>
                      <div className="absolute top-[80px] z-20 w-8 h-8 rounded-full bg-[#F4C542] text-black font-bold flex items-center justify-center shadow-lg border-2 border-[#0A1424]">1</div>
                      <div className="w-full bg-gradient-to-b from-[#D4A832]/20 to-[#0F141C]/95 backdrop-blur-md border border-[#F5C242]/50 rounded-[24px] shadow-[0_0_40px_rgba(230,180,50,0.2)] p-8 pt-12 flex flex-col items-center text-center">
                        <h3 className="text-2xl font-bold text-white mb-2">{rank1.name.split(' ')[0]}</h3>
                        <div className="text-5xl font-black text-[#F4C542] drop-shadow-[0_0_10px_rgba(244,197,66,0.5)] mb-1">
                          <CountUp value={rank1.points} />
                        </div>
                        <span className="text-xs font-bold text-[#F4C542]/80 tracking-widest uppercase">Points</span>
                        <div className="mt-4 px-3 py-1 rounded-full bg-[#F4C542]/10 border border-[#F4C542]/30 flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-[#F4C542] fill-[#F4C542]" />
                          <span className="text-xs font-bold text-[#F4C542]">Top Performer</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Rank 2 (Silver) */}
                {rank2 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
                    className="relative w-full lg:w-[280px] flex flex-col items-center lg:order-1 hover:-translate-y-2 transition-transform duration-300"
                  >
                    <div className="relative z-10 w-24 h-24 lg:w-28 lg:h-28 rounded-full border-[3px] border-[#BFCBE0] bg-[#0A1424] shadow-[0_0_25px_rgba(191,203,224,0.3)] flex items-center justify-center mb-[-25px] overflow-hidden">
                      {getAvatar(rank2)}
                    </div>
                    <div className="absolute top-[65px] lg:top-[80px] z-20 w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-[#BFCBE0] text-black font-bold flex items-center justify-center shadow-lg border-2 border-[#0A1424]">2</div>
                    <div className="w-full h-full lg:h-[260px] bg-gradient-to-b from-[#8EA2BC]/15 to-[#0F141C]/95 backdrop-blur-md border border-[#8EA2BC]/40 rounded-[24px] shadow-[0_0_30px_rgba(142,162,188,0.15)] p-6 pt-10 flex flex-col items-center text-center justify-end pb-8">
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{rank2.name}</h3>
                      <div className="text-4xl font-black text-[#BFCBE0] drop-shadow-[0_0_10px_rgba(191,203,224,0.4)] mb-1">
                        <CountUp value={rank2.points} />
                      </div>
                      <span className="text-xs font-bold text-[#BFCBE0]/80 tracking-widest uppercase">Points</span>
                      <div className="mt-3 px-3 py-1 rounded-full bg-[#BFCBE0]/10 border border-[#BFCBE0]/30 flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-[#BFCBE0] fill-[#BFCBE0]" />
                        <span className="text-xs font-bold text-[#BFCBE0]">Great Work!</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Desktop Rank 1 (Gold) */}
                {rank1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
                    className="hidden lg:flex relative w-[340px] flex-col items-center order-2 hover:-translate-y-2 transition-transform duration-300 z-20"
                  >
                    <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-20 z-20">
                      <Crown className="w-16 h-16 text-[#F4C542] drop-shadow-[0_0_20px_rgba(244,197,66,0.8)] fill-[#F4C542]" />
                    </motion.div>
                    <div className="relative z-10 w-36 h-36 rounded-full border-[4px] border-[#F4C542] bg-[#0A1424] shadow-[0_0_40px_rgba(244,197,66,0.4)] flex items-center justify-center mb-[-35px] overflow-hidden">
                      {getAvatar(rank1)}
                    </div>
                    <div className="absolute top-[100px] z-20 w-9 h-9 rounded-full bg-[#F4C542] text-black font-bold flex items-center justify-center shadow-lg border-2 border-[#0A1424]">1</div>
                    <div className="w-full h-[320px] bg-gradient-to-b from-[#D4A832]/20 to-[#0F141C]/95 backdrop-blur-md border border-[#F5C242]/50 rounded-[24px] shadow-[0_0_50px_rgba(230,180,50,0.2)] p-8 pt-14 flex flex-col items-center text-center justify-end pb-10">
                      <h3 className="text-2xl font-bold text-white mb-2 line-clamp-1">{rank1.name}</h3>
                      <div className="text-5xl font-black text-[#F4C542] drop-shadow-[0_0_15px_rgba(244,197,66,0.5)] mb-1">
                        <CountUp value={rank1.points} />
                      </div>
                      <span className="text-[10px] font-bold text-[#F4C542]/80 tracking-widest uppercase">Points</span>
                      <div className="mt-4 px-4 py-1.5 rounded-full bg-[#F4C542]/10 border border-[#F4C542]/30 flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-[#F4C542]" />
                        <span className="text-xs font-bold text-[#F4C542]">Top Performer</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Rank 3 (Bronze) */}
                {rank3 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
                    className="relative w-full lg:w-[280px] flex flex-col items-center lg:order-3 hover:-translate-y-2 transition-transform duration-300"
                  >
                    <div className="relative z-10 w-24 h-24 lg:w-28 lg:h-28 rounded-full border-[3px] border-[#D58A45] bg-[#0A1424] shadow-[0_0_25px_rgba(213,138,69,0.3)] flex items-center justify-center mb-[-25px] overflow-hidden">
                      {getAvatar(rank3)}
                    </div>
                    <div className="absolute top-[65px] lg:top-[80px] z-20 w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-[#D58A45] text-black font-bold flex items-center justify-center shadow-lg border-2 border-[#0A1424]">3</div>
                    <div className="w-full h-full lg:h-[260px] bg-gradient-to-b from-[#B86B32]/15 to-[#0F141C]/95 backdrop-blur-md border border-[#D58A45]/40 rounded-[24px] shadow-[0_0_30px_rgba(184,107,50,0.15)] p-6 pt-10 flex flex-col items-center text-center justify-end pb-8">
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{rank3.name}</h3>
                      <div className="text-4xl font-black text-[#D58A45] drop-shadow-[0_0_10px_rgba(213,138,69,0.4)] mb-1">
                        <CountUp value={rank3.points} />
                      </div>
                      <span className="text-xs font-bold text-[#D58A45]/80 tracking-widest uppercase">Points</span>
                      <div className="mt-3 px-3 py-1 rounded-full bg-[#D58A45]/10 border border-[#D58A45]/30 flex items-center gap-1.5">
                        <Flame className="w-3 h-3 text-[#D58A45] fill-[#D58A45]" />
                        <span className="text-xs font-bold text-[#D58A45]">Keep Going!</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Full Rankings List */}
          {rest.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-8 lg:mt-16 w-full"
            >
              <div className="bg-[#0F1827]/75 backdrop-blur-xl border border-white/10 rounded-[24px] overflow-hidden shadow-2xl">
                
                {/* Desktop Table Header */}
                <div className="hidden lg:grid grid-cols-[80px_300px_1fr_120px_200px_120px] gap-4 p-6 border-b border-white/10 text-xs font-bold text-[#9AA8BC] tracking-wider uppercase">
                  <div className="text-center">Rank</div>
                  <div>Student</div>
                  <div>Class</div>
                  <div className="text-right">Points</div>
                  <div>Progress</div>
                  <div className="text-right">Streak</div>
                </div>

                <div className="flex flex-col">
                  {rest.map((student, idx) => {
                    // Homework completion progress
                    const accuracy = student.homeworkCount > 0 ? Math.min(100, Math.round((student.points / (student.homeworkCount * 20)) * 100)) : 0;
                    
                    return (
                      <motion.div
                        key={student.studentId}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                        className="group flex flex-col lg:grid lg:grid-cols-[80px_300px_1fr_120px_200px_120px] gap-4 lg:gap-4 p-5 lg:p-6 border-b border-white/[0.04] last:border-none hover:bg-white/[0.03] transition-colors relative"
                      >
                        {/* Mobile view changes layout entirely to fit cleanly */}
                        
                        {/* Rank */}
                        <div className="hidden lg:flex items-center justify-center font-bold text-lg text-[#9AA8BC]">
                          #{student.rank}
                        </div>

                        {/* Mobile Header (Rank + Name) */}
                        <div className="flex lg:hidden items-center justify-between mb-2">
                          <div className="font-bold text-[#9AA8BC] bg-white/5 px-3 py-1 rounded-full text-sm">#{student.rank}</div>
                          <div className="flex items-center gap-1.5 text-sm text-[#F4C542] font-semibold bg-[#F4C542]/10 px-3 py-1 rounded-full border border-[#F4C542]/20">
                            <Star className="w-3.5 h-3.5 fill-[#F4C542]" />
                            {student.streak || 0} Streak
                          </div>
                        </div>

                        {/* Student */}
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#1A2639] flex items-center justify-center border border-white/10 shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                            {getAvatar(student)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-base lg:text-lg">{student.name}</div>
                            <div className="text-sm text-[#9AA8BC] lg:hidden">Class {student.class || "N/A"}</div>
                          </div>
                        </div>

                        {/* Class (Desktop) */}
                        <div className="hidden lg:flex items-center text-[#9AA8BC]">
                          {student.class ? `Class ${student.class}` : "N/A"}
                        </div>

                        {/* Points */}
                        <div className="flex lg:justify-end items-center mt-2 lg:mt-0">
                          <span className="lg:hidden text-[#9AA8BC] mr-2 text-sm">Points:</span>
                          <div className="text-xl font-bold text-[#F4C542]"><CountUp value={student.points} duration={1000} /></div>
                        </div>

                        {/* Progress */}
                        <div className="flex flex-col justify-center gap-2 mt-2 lg:mt-0">
                          <div className="flex justify-between text-xs text-[#9AA8BC]">
                            <span>Accuracy</span>
                            <span>{accuracy}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: `${accuracy}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-[#F4C542]/50 to-[#F4C542] rounded-full"
                            />
                          </div>
                        </div>

                        {/* Streak (Desktop) */}
                        <div className="hidden lg:flex items-center justify-end text-[#F4C542] font-semibold gap-1.5">
                          <Flame className="w-4 h-4 fill-[#F4C542]" />
                          {student.streak || 0}
                        </div>
                        
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer Motto */}
          <div className="text-center mt-8 pb-12 opacity-40 flex items-center justify-center gap-4 text-xs font-bold tracking-[0.2em] uppercase">
            <span>Learn</span>
            <div className="w-1 h-1 rounded-full bg-white/50" />
            <span>Improve</span>
            <div className="w-1 h-1 rounded-full bg-white/50" />
            <span>Lead</span>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
