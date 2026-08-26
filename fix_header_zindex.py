import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '<header className="h-[60px] shrink-0 bg-[#07111F]/85 backdrop-blur-[32px] border-b border-white/[0.06] flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">',
    '<header className="h-[60px] shrink-0 relative bg-[#07111F]/85 backdrop-blur-[32px] border-b border-white/[0.06] flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">'
)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
