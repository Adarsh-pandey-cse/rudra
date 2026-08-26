import re

with open("src/app/dashboard/teacher/doubts/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace any corrupted unicode blocks
content = re.sub(
    r'Class \{doubt\.classId\} [^\w\s<>]+ \{doubt\.subjectName\} [^\w\s<>]+ \{doubt\.topicName \|\| "General"\}',
    r'Class {doubt.classId} &bull; {doubt.subjectName} &bull; {doubt.topicName || "General"}',
    content
)

# In case it failed, just brute force replace it
content = content.replace("?", "&bull;")

with open("src/app/dashboard/teacher/doubts/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
