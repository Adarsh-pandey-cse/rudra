import re

with open('src/app/dashboard/student/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'markAsRead(recentNotice.id, currentUser.id);',
    'if (recentNotice) markAsRead(recentNotice.id, currentUser.id);'
)

with open('src/app/dashboard/student/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
