import re

with open('src/app/dashboard/student/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const { getStudentNotices, getUnreadCount } = useNoticeStore();',
    'const { getStudentNotices, getUnreadCount, isRead, markAsRead } = useNoticeStore();'
)

content = content.replace(
    'const { isRead, markAsRead } = useNoticeStore();\n  const unreadNotices',
    'const unreadNotices'
)

with open('src/app/dashboard/student/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
