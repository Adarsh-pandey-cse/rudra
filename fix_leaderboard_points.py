import re

with open("src/store/leaderboardStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Fix HOMEWORK_GRADED
content = content.replace(
    'if (payload && payload.studentId && payload.grade !== undefined && !payload.isLate) {',
    'if (payload && payload.studentId && payload.grade !== undefined) {'
)

# Fix HOMEWORK_SUBMITTED
content = content.replace(
    'if (payload && payload.studentId && !payload.isLate) {',
    'if (payload && payload.studentId) {'
)

with open("src/store/leaderboardStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
