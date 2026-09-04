import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'const unreadCount = inAppNotifs.filter(n => !n.read).length;',
    'const unreadCount = inAppNotifs.filter(n => !n.read).length;\n  const chatUnread = useChatStore(state => state.unreadTotal);'
)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
