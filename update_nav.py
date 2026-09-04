import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Make sure MessageSquare is imported from lucide-react
if "MessageSquare," not in content and "MessageSquare " not in content:
    content = content.replace('Users, ClipboardList, BookOpen, FileText, CheckSquare, Plus, ArrowRight, Activity, LogOut, ChevronRight, Menu, Bell', 'Users, ClipboardList, BookOpen, FileText, CheckSquare, Plus, ArrowRight, Activity, LogOut, ChevronRight, Menu, Bell, MessageSquare')

# Add chat store import to get unread total
if "useChatStore" not in content:
    content = content.replace('import { useNotificationStore } from "@/store/notificationStore";', 'import { useNotificationStore } from "@/store/notificationStore";\nimport { useChatStore } from "@/store/chatStore";')

# Inject Chat into nav items
if "/dashboard/teacher/chat" not in content:
    content = content.replace(
        '{ label: "Dashboard", href: "/dashboard/teacher", icon: LayoutDashboard },',
        '{ label: "Dashboard", href: "/dashboard/teacher", icon: LayoutDashboard },\n  { label: "Chat", href: "/dashboard/teacher/chat", icon: MessageSquare },'
    )
    content = content.replace(
        '{ label: "Dashboard", href: "/dashboard/student", icon: LayoutDashboard },',
        '{ label: "Dashboard", href: "/dashboard/student", icon: LayoutDashboard },\n  { label: "Chat", href: "/dashboard/student/chat", icon: MessageSquare },'
    )

# Use chatStore for unread dot
# Search for `const unreadCount = useNotificationStore`
if "const chatUnread = useChatStore" not in content:
    content = content.replace(
        'const unreadCount = useNotificationStore(state => state.getUnreadCount());',
        'const unreadCount = useNotificationStore(state => state.getUnreadCount());\n  const chatUnread = useChatStore(state => state.unreadTotal);'
    )

# Search for `const hasNewEvents = (href: string)`
if "if (href.includes('chat') && chatUnread > 0) return true;" not in content:
    content = content.replace(
        'if (href.includes(\'leaderboard\')) {',
        'if (href.includes(\'chat\') && chatUnread > 0) return true;\n      if (href.includes(\'leaderboard\')) {'
    )

# Search for `item.href === "#notifications" && unreadCount > 0` and add chat logic for bottom nav
content = content.replace(
    '{item.href === "#notifications" && unreadCount > 0 && (',
    '{(item.href === "#notifications" && unreadCount > 0) || (item.href.includes("chat") && chatUnread > 0) ? ('
)

# Fix the condition to properly close
content = content.replace(
    '{(item.href === "#notifications" && unreadCount > 0) || (item.href.includes("chat") && chatUnread > 0) ? (\n                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full animate-pulse border-2 border-[#07111F]" />\n                      )}',
    '{(item.href === "#notifications" && unreadCount > 0) || (item.href.includes("chat") && chatUnread > 0) ? (\n                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full animate-pulse border-2 border-[#07111F]" />\n                      ) : null}'
)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
