import re

with open("src/app/dashboard/student/leaderboard/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add import for LeaderboardPodium
if "LeaderboardPodium" not in content:
    content = content.replace(
        'import GlassCard from "@/components/ui/GlassCard";',
        'import GlassCard from "@/components/ui/GlassCard";\nimport { LeaderboardPodium } from "@/components/ui/LeaderboardPodium";'
    )

# Replace the manual podium logic
old_podium_start = """  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Podium order: 2nd, 1st, 3rd
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);"""

new_podium_start = """  const rest = leaderboard.filter(s => s.rank > 3);"""

content = content.replace(old_podium_start, new_podium_start)

# Now find the whole Podium block and replace it
# From {/* Podium */} to {/* List */}
podium_block_regex = r'\{\/\* Podium \*\/.*?\{\/\* List \*\/'
new_podium_block = '{/* Podium */}\n        <LeaderboardPodium leaderboard={leaderboard} />\n\n        {/* List */'

content = re.sub(podium_block_regex, new_podium_block, content, flags=re.DOTALL)

with open("src/app/dashboard/student/leaderboard/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
