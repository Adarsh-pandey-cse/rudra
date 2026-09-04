import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix MessageSquare import
content = content.replace("import { MessageSquare,", "import {")
if "MessageSquare" not in content.split("from \"lucide-react\"")[0]:
    content = content.replace("from \"lucide-react\";", "MessageSquare, } from \"lucide-react\";")

# Make sure useChatStore is imported
if "useChatStore" not in content:
    content = content.replace('import { useNotificationStore } from "@/store/notificationStore";', 'import { useNotificationStore } from "@/store/notificationStore";\nimport { useChatStore } from "@/store/chatStore";')

# Inject chatUnread
if "const chatUnread = useChatStore" not in content:
    content = content.replace(
        'const unreadCount = useNotificationStore(state => state.getUnreadCount());',
        'const unreadCount = useNotificationStore(state => state.getUnreadCount());\n    const chatUnread = useChatStore(state => state.unreadTotal);'
    )

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
