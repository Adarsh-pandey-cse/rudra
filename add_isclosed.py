import re

with open("src/types/homework-types.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '  scheduledDate?: string;',
    '  scheduledDate?: string;\n  isClosed?: boolean;'
)

with open("src/types/homework-types.ts", "w", encoding="utf-8") as f:
    f.write(content)
