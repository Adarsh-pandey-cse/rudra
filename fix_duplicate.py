import re

with open('src/app/dashboard/student/notices/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'onClick={() => markAsRead(notice.id, student.id)}\n                      onClick={() => markAsRead(notice.id, student.id)}',
    'onClick={() => markAsRead(notice.id, student.id)}'
)

with open('src/app/dashboard/student/notices/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
