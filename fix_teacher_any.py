import re

with open('src/app/dashboard/teacher/doubts/[id]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'users.find(u => u.id === doubt.studentId)',
    'users.find((u: any) => u.id === doubt.studentId)'
)

with open('src/app/dashboard/teacher/doubts/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
