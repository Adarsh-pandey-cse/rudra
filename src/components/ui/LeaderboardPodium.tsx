import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

export const LeaderboardPodium = ({ leaderboard }: { leaderboard: any[] }) => {
  // Group by rank
  const rank1 = leaderboard.filter(s => s.rank === 1);
  const rank2 = leaderboard.filter(s => s.rank === 2);
  const rank3 = leaderboard.filter(s => s.rank === 3);

  const groups = [
    { rank: 2, students: rank2, height: "h-36", color: "from-[#94A3B8]/20 to-[#94A3B8]/5 border-[#94A3B8]/50", border: "border-[#94A3B8]", badge: "bg-[#94A3B8] text-black", delay: 0.2 },
    { rank: 1, students: rank1, height: "h-48", color: "from-[#EAB308]/20 to-[#EAB308]/5 border-[#EAB308]/50", border: "border-[#EAB308]", badge: "bg-[#EAB308] text-black", delay: 0 },
    { rank: 3, students: rank3, height: "h-28", color: "from-[#B45309]/20 to-[#B45309]/5 border-[#B45309]/50", border: "border-[#B45309]", badge: "bg-[#B45309] text-white", delay: 0.4 }
  ];

  if (rank1.length === 0) {
    return <div className="py-12 text-center text-[#7B8798]">Not enough students for a podium yet.</div>;
  }

  return (
    <div className="flex justify-center items-end gap-2 md:gap-6 pt-12 pb-8">
      {groups.map((group, idx) => {
        if (group.students.length === 0) return null;
        
        const isFirst = group.rank === 1;

        return (
          <motion.div 
            key={"podium-${group.rank}"}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: group.delay, type: "spring" }}
            className="flex flex-col items-center relative"
          >
            {isFirst && (
              <Crown className="w-8 h-8 text-[#EAB308] absolute -top-12 animate-bounce" />
            )}
            <div className="relative mb-4 z-10">
              <div className="flex -space-x-4 justify-center">
                {group.students.slice(0, 3).map((student, sIdx) => (
                  <div key={student.studentId} className={"w-14 h-14 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center bg-gradient-to-br from-[#0D1929] to-[#07111F] text-xl font-bold text-white shadow-2xl ${group.border} relative"} style={{ zIndex: 3 - sIdx }}>
                    {student.avatar && student.avatar.length > 10 ? (
                      <img src={student.avatar} alt={student.name || "Student"} className="w-full h-full rounded-full object-cover" />
                    ) : student.avatar ? (
                      <span className="text-sm md:text-xl font-bold text-white">{student.avatar}</span>
                    ) : (
                      (student.name || "S").substring(0, 2).toUpperCase()
                    )}
                  </div>
                ))}
                {group.students.length > 3 && (
                  <div className={"w-14 h-14 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center bg-[#0D1929] text-xs font-bold text-white shadow-2xl ${group.border} relative"} style={{ zIndex: 0 }}>
                    +{group.students.length - 3}
                  </div>
                )}
              </div>
              <div className={"absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#07111F] shadow-lg z-20 ${group.badge}"}>
                #{group.rank}
              </div>
            </div>
            
            <div className={"w-28 md:w-40 ${group.height} rounded-t-2xl bg-gradient-to-b ${group.color} border-t-2 border-x border-white/0 backdrop-blur-sm flex flex-col items-center pt-4 shadow-[0_0_30px_rgba(0,0,0,0.3)] px-1"}>
              {group.students.slice(0, 2).map(s => (
                 <p key={s.studentId} className="text-white font-bold text-center text-[11px] md:text-sm truncate w-full leading-tight mb-0.5">{s.name}</p>
              ))}
              {group.students.length > 2 && (
                 <p className="text-white/70 text-[10px] md:text-xs">+{group.students.length - 2} more</p>
              )}
              <p className="text-[#EAB308] font-bold text-sm md:text-lg mt-auto">{group.students[0].points}</p>
              <p className="text-[10px] text-[#7B8798] uppercase tracking-wider mb-2">Points</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
