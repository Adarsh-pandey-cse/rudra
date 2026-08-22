import re

with open('src/app/dashboard/student/notices/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add onClick to both SmartNoticeCard usages
content = content.replace(
    'isPinned \n                      onAcknowledge={handleAcknowledge}',
    'isPinned \n                      onClick={() => markAsRead(notice.id, student.id)}\n                      onAcknowledge={handleAcknowledge}'
)

content = content.replace(
    'onAcknowledge={handleAcknowledge}\n                      hasAcknowledged',
    'onClick={() => markAsRead(notice.id, student.id)}\n                      onAcknowledge={handleAcknowledge}\n                      hasAcknowledged'
)

with open('src/app/dashboard/student/notices/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
