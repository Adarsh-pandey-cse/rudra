import re

with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(
    r'</AnimatePresence>,\s*document\.body\s*\)\}(,\s*document\.body\s*\)\})+',
    r'</AnimatePresence>,\n        document.body\n        )}',
    content
)

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
