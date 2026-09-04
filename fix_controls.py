import re

with open("src/components/ui/InlineFileViewer.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Make the bottom control bar completely visible against white backgrounds
content = content.replace(
    'bg-black/70 backdrop-blur-md border border-white/10 p-1.5 rounded-xl shadow-2xl',
    'bg-[#070D19] border border-white/20 p-1.5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.8)]'
)

with open("src/components/ui/InlineFileViewer.tsx", "w", encoding="utf-8") as f:
    f.write(content)
