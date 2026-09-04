import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace sidebar class
content = re.sub(
    r'<div className="w-80 shrink-0 border-r border-white/\[0\.06\] flex flex-col bg-\[#070D19\]">',
    r'<div className={cn("w-full md:w-80 shrink-0 border-r border-white/[0.06] flex-col bg-[#070D19]", activeThreadId ? "hidden md:flex" : "flex")}>',
    content
)

# Replace main chat class
content = re.sub(
    r'<div className="flex-1 flex flex-col relative bg-\[#0B1527\] min-w-0">',
    r'<div className={cn("flex-1 flex-col relative bg-[#0B1527] min-w-0", !activeThreadId ? "hidden md:flex" : "flex")}>',
    content
)

# Insert the back button in header if not already there
header_pattern = r'(<div className="flex items-center gap-3">\s*<div className="w-10 h-10 rounded-full bg-white/\[0\.06\] flex items-center justify-center overflow-hidden">)'

if "ArrowLeft" not in content[content.find("flex items-center gap-3"):content.find("flex items-center gap-3")+300]:
    content = re.sub(
        header_pattern,
        r'<div className="flex items-center gap-3">\n                  <button onClick={() => setActiveThreadId(null)} className="md:hidden p-2 -ml-2 hover:bg-white/[0.1] rounded-full text-[#B6C2D9] transition-colors"><ArrowLeft className="w-5 h-5" /></button>\n                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden">',
        content
    )

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
