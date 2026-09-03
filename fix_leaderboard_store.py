import re

with open("src/store/leaderboardStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_sort_logic = """          currentEntries.sort((a, b) => {
            if (b.points !== a.points) return (b.points || 0) - (a.points || 0);
            if (b.streak !== a.streak) return (b.streak || 0) - (a.streak || 0);
              const aTime = (a as any).lastSubmissionAt || Number.MAX_SAFE_INTEGER;
              const bTime = (b as any).lastSubmissionAt || Number.MAX_SAFE_INTEGER;
              if (aTime !== bTime) return aTime - bTime;
            return (a.name || "").localeCompare(b.name || "");
          });
          currentEntries.forEach((e, i) => e.rank = i + 1);"""

new_sort_logic = """          currentEntries.sort((a, b) => {
            if (b.points !== a.points) return (b.points || 0) - (a.points || 0);
            if (b.streak !== a.streak) return (b.streak || 0) - (a.streak || 0);
            return 0; // If points and streak match, they are a complete tie!
          });
          
          let currentRank = 1;
          for (let i = 0; i < currentEntries.length; i++) {
            if (i > 0) {
              const prev = currentEntries[i - 1];
              const curr = currentEntries[i];
              if (prev.points === curr.points && prev.streak === curr.streak) {
                curr.rank = prev.rank;
              } else {
                curr.rank = i + 1;
              }
            } else {
              currentEntries[i].rank = 1;
            }
          }"""

# Need to replace it in two places: initializeLeaderboard and getLeaderboard
# Wait, let's use regex to find both sorting blocks.

content = re.sub(
    r'currentEntries\.sort\(\(a, b\) => \{[^\}]+\}\);\s*currentEntries\.forEach\(\(e, i\) => e\.rank = i \+ 1\);',
    new_sort_logic,
    content,
    flags=re.DOTALL
)

# However, the indentation might be tricky, let's do a more robust replace by just matching the signature
content = re.sub(
    r'currentEntries\.sort\(\(a, b\) => \{.*?currentEntries\.forEach\(\(e, i\) => e\.rank = i \+ 1\);',
    new_sort_logic,
    content,
    flags=re.DOTALL
)

with open("src/store/leaderboardStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
