import re

with open("src/store/leaderboardStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

pattern = re.compile(r'const unsub1 = eventBus\.on\("HOMEWORK_GRADED", \(event\) => \{.*?\s*get\(\)\.addPoints\(payload\.studentId, payload\.grade, "Homework graded"\);\s*\}\s*\}\);', re.DOTALL)

new_handler = """const unsub1 = eventBus.on("HOMEWORK_GRADED", (event) => {
          const payload = event.payload as any;
          if (payload && payload.studentId && payload.grade !== undefined) {
            let pointsToAdd = payload.grade;
            if (payload.previousGrade !== undefined && payload.previousGrade !== null) {
              pointsToAdd = payload.grade - payload.previousGrade;
            }
            if (pointsToAdd !== 0) {
              get().addPoints(payload.studentId, pointsToAdd, "Homework graded");
            }
          }
        });"""

content = pattern.sub(new_handler, content)

with open("src/store/leaderboardStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
