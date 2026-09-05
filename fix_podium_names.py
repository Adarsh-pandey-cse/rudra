import re

with open("src/components/ui/LeaderboardPodium.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_box = """            <div className={`w-28 md:w-40 ${group.height} rounded-t-2xl bg-gradient-to-b ${group.color} border-t-2 border-x border-white/0 backdrop-blur-sm flex flex-col items-center pt-4 shadow-[0_0_30px_rgba(0,0,0,0.3)] px-1`}>
              <p className="text-white font-bold text-center text-[11px] md:text-sm truncate w-full leading-tight mb-0.5">{group.students[0].name}</p>
              {group.students.length > 1 && (
                 <p className="text-white/70 font-semibold text-[10px] md:text-xs bg-black/20 rounded-full px-2 py-0.5 mt-1">+{group.students.length - 1} more</p>
              )}
              <p className="text-[#EAB308] font-bold text-sm md:text-lg mt-auto">{group.students[0].points}</p>
              <p className="text-[10px] text-[#7B8798] uppercase tracking-wider mb-2">Points</p>
            </div>"""

new_box = """            <div className={`w-28 md:w-40 ${group.height} rounded-t-2xl bg-gradient-to-b ${group.color} border-t-2 border-x border-white/0 backdrop-blur-sm flex flex-col items-center pt-4 shadow-[0_0_30px_rgba(0,0,0,0.3)] px-2`}>
              <div className="flex-1 w-full flex flex-col items-center overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1">
                {group.students.map(s => (
                  <p key={s.studentId} className="text-white font-bold text-center text-[10px] md:text-xs truncate w-full leading-tight mb-1">{s.name}</p>
                ))}
              </div>
              <div className="mt-auto flex flex-col items-center shrink-0 pt-1">
                <p className="text-[#EAB308] font-bold text-sm md:text-lg">{group.students[0].points}</p>
                <p className="text-[10px] text-[#7B8798] uppercase tracking-wider mb-2">Points</p>
              </div>
            </div>"""

content = content.replace(old_box, new_box)

with open("src/components/ui/LeaderboardPodium.tsx", "w", encoding="utf-8") as f:
    f.write(content)
