import re

with open('src/app/dashboard/teacher/tests/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const target = selectedClass.toString().toLowerCase();',
    'const target = (selectedClass || "").toString().toLowerCase();'
)

with open('src/app/dashboard/teacher/tests/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
