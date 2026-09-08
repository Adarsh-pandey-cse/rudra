import re

with open("src/app/dashboard/teacher/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

if "import { Activity" not in content:
    content = content.replace('import {', 'import {\n  Activity,', 1)

content = content.replace(
    '{ label: "Student\\nChats", icon: MessageSquare, href: "/dashboard/teacher/chat", color: "text-[#10B981]", bg: "bg-[#10B981]/10", border: "border-[#10B981]/20", isChat: true },',
    '{ label: "Student\\nChats", icon: MessageSquare, href: "/dashboard/teacher/chat", color: "text-[#10B981]", bg: "bg-[#10B981]/10", border: "border-[#10B981]/20", isChat: true },\n    { label: "App\\nUsage", icon: Activity, href: "/dashboard/teacher/usage", color: "text-[#38BDF8]", bg: "bg-[#38BDF8]/10", border: "border-[#38BDF8]/20" },'
)

with open("src/app/dashboard/teacher/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
