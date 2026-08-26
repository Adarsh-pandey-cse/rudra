import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '<aside className="hidden lg:block shrink-0 w-[260px] z-20">',
    '<aside className="hidden lg:block relative shrink-0 w-[260px] z-20">'
)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
