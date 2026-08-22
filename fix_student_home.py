import re

with open('src/app/dashboard/student/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update the recentNotice logic to only show unread notices
content = content.replace(
    'const recentNotice = myNotices.length > 0 ? myNotices[0] : null;',
    'const { isRead, markAsRead } = useNoticeStore();\n  const unreadNotices = myNotices.filter(n => !isRead(n.id, currentUser.id));\n  const recentNotice = unreadNotices.length > 0 ? unreadNotices[0] : null;'
)

# Update onClick handler on the home page notice
content = content.replace(
    '''onClick={() => router.push('/dashboard/student/notices')}''',
    '''onClick={() => {
                  markAsRead(recentNotice.id, currentUser.id);
                  router.push('/dashboard/student/notices');
                }}'''
)

with open('src/app/dashboard/student/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
