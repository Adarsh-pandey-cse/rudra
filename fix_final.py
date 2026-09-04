import re

# Fix teacher useRef
with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace("useRef<() => void>()", "useRef<(() => void) | null>(null)")
with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

# Fix DashboardLayout chatUnread
with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content2 = f.read()

if "const chatUnread =" not in content2:
    content2 = content2.replace('const unreadCount = useNotificationStore(state => state.getUnreadCount());', 'const unreadCount = useNotificationStore(state => state.getUnreadCount());\n  const chatUnread = useChatStore(state => state.unreadTotal);')

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content2)
