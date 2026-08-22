import re

with open('src/app/dashboard/teacher/tests/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'const currentStudents = students.filter(s =>' in line:
        lines[i] = '  const currentStudents = students.filter(s => (s as any).grade === selectedClass || (s as any).classId === class- || (s as any).classId === selectedClass);'

with open('src/app/dashboard/teacher/tests/page.tsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
