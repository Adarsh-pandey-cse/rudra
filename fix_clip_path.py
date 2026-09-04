import re

with open("src/components/ui/InlineFileViewer.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'className="relative w-full h-full flex flex-col items-center justify-center bg-[#0B1527] rounded-xl overflow-hidden border border-white/10 group touch-none isolate z-0"',
    'className="relative w-full h-full flex flex-col items-center justify-center bg-[#0B1527] rounded-xl overflow-hidden border border-white/10 group touch-none" style={{ clipPath: "inset(0)", contain: "paint layout" }}'
)

with open("src/components/ui/InlineFileViewer.tsx", "w", encoding="utf-8") as f:
    f.write(content)


with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "r", encoding="utf-8") as f:
    content2 = f.read()

content2 = content2.replace(
    'className="w-full lg:w-[60%] border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#07111F] flex flex-col relative min-h-[50vh] lg:min-h-0 lg:h-full shrink-0 overflow-hidden isolate z-0"',
    'className="w-full lg:w-[60%] border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#07111F] flex flex-col relative min-h-[50vh] lg:min-h-0 lg:h-full shrink-0 overflow-hidden" style={{ clipPath: "inset(0)" }}'
)

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content2)
