import re

with open("src/store/homeworkStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("existing.aiEvaluation.score", "existing.aiEvaluation.suggestedMarks")
content = content.replace("sub.aiEvaluation.score", "sub.aiEvaluation.suggestedMarks")

with open("src/store/homeworkStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
