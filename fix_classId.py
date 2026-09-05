import re

with open("src/components/ui/PremiumLeaderboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("student.classId", "student.class")

with open("src/components/ui/PremiumLeaderboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
