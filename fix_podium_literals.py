import re

with open("src/components/ui/LeaderboardPodium.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix broken template literals
content = content.replace('key={"podium-${group.rank}"}', 'key={`podium-${group.rank}`}')
content = content.replace(
    'className={"w-14 h-14 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center bg-gradient-to-br from-[#0D1929] to-[#07111F] text-xl font-bold text-white shadow-2xl ${group.border} relative"}',
    'className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center bg-gradient-to-br from-[#0D1929] to-[#07111F] text-xl font-bold text-white shadow-2xl ${group.border} relative`}'
)
content = content.replace(
    'className={"w-14 h-14 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center bg-[#0D1929] text-xs font-bold text-white shadow-2xl ${group.border} relative"}',
    'className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center bg-[#0D1929] text-xs font-bold text-white shadow-2xl ${group.border} relative`}'
)
content = content.replace(
    'className={"absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#07111F] shadow-lg z-20 ${group.badge}"}',
    'className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#07111F] shadow-lg z-20 ${group.badge}`}'
)
content = content.replace(
    'className={"w-28 md:w-40 ${group.height} rounded-t-2xl bg-gradient-to-b ${group.color} border-t-2 border-x border-white/0 backdrop-blur-sm flex flex-col items-center pt-4 shadow-[0_0_30px_rgba(0,0,0,0.3)] px-1"}',
    'className={`w-28 md:w-40 ${group.height} rounded-t-2xl bg-gradient-to-b ${group.color} border-t-2 border-x border-white/0 backdrop-blur-sm flex flex-col items-center pt-4 shadow-[0_0_30px_rgba(0,0,0,0.3)] px-1`}'
)

with open("src/components/ui/LeaderboardPodium.tsx", "w", encoding="utf-8") as f:
    f.write(content)
