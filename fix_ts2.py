import re
with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(
    r'fatherName:\s*editFatherName\s*\}\);',
    r'fatherName: editFatherName\n      } as any);',
    content
)

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
