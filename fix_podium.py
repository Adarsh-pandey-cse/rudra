import re

with open("src/components/ui/LeaderboardPodium.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the stacking names with just 1 name and a "+X more" tag if tied
old_render = """              {group.students.slice(0, 2).map(s => (
                 <p key={s.studentId} className="text-white font-bold text-center text-[11px] md:text-sm truncate w-full leading-tight mb-0.5">{s.name}</p>
              ))}
              {group.students.length > 2 && (
                 <p className="text-white/70 text-[10px] md:text-xs">+{group.students.length - 2} more</p>
              )}"""

new_render = """              <p className="text-white font-bold text-center text-[11px] md:text-sm truncate w-full leading-tight mb-0.5">{group.students[0].name}</p>
              {group.students.length > 1 && (
                 <p className="text-white/70 font-semibold text-[10px] md:text-xs bg-black/20 rounded-full px-2 py-0.5 mt-1">+{group.students.length - 1} more</p>
              )}"""

content = content.replace(old_render, new_render)

with open("src/components/ui/LeaderboardPodium.tsx", "w", encoding="utf-8") as f:
    f.write(content)
