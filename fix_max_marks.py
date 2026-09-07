import re

with open("src/store/homeworkStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("sub.maxMarks || (assignment?.maxMarks || 0)", "sub.maxMarks || (assignment?.maxMarks || 20)")

with open("src/store/homeworkStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
