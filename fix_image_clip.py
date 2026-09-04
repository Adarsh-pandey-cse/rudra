import re

with open("src/components/ui/InlineFileViewer.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix the CSS clipping bug by adding isolation-isolate and z-0
content = content.replace(
    'className="relative w-full h-full flex flex-col items-center justify-center bg-[#0B1527] rounded-xl overflow-hidden border border-white/10 group touch-none"',
    'className="relative w-full h-full flex flex-col items-center justify-center bg-[#0B1527] rounded-xl overflow-hidden border border-white/10 group touch-none isolate z-0"'
)
content = content.replace(
    'className="w-full h-full flex items-center justify-center overflow-hidden relative"',
    'className="w-full h-full flex items-center justify-center overflow-hidden relative" style={{ isolation: "isolate" }}'
)

with open("src/components/ui/InlineFileViewer.tsx", "w", encoding="utf-8") as f:
    f.write(content)
