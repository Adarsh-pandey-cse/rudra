import re

with open("src/app/dashboard/teacher/doubts/[id]/page.tsx", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

content = re.sub(
    r'<>Class \{doubt\.classId\} .* \{doubt\.subjectName\} .* \{doubt\.topicName \|\| "General"\}</>',
    r'<>Class {doubt.classId} &bull; {doubt.subjectName} &bull; {doubt.topicName || "General"}</>',
    content
)

with open("src/app/dashboard/teacher/doubts/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
