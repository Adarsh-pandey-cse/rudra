import re

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Make the left panel fully clip its contents
content = content.replace(
    'className="w-full lg:w-[60%] border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#07111F] flex flex-col relative min-h-[50vh] lg:min-h-0 lg:h-full shrink-0 overflow-hidden"',
    'className="w-full lg:w-[60%] border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#07111F] flex flex-col relative min-h-[50vh] lg:min-h-0 lg:h-full shrink-0 overflow-hidden isolate z-0"'
)

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
