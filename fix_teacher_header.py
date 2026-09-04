import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# I will replace the right-side header logic to correctly show selected student's name and avatar
old_header = """            <>
              {/* Header */}
              <div className="h-16 border-b border-white/[0.06] bg-[#131D2E] flex items-center justify-between px-6 shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center">
                    <User className="w-5 h-5 text-[#B6C2D9]" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold leading-tight">{activeThread?.studentName || "Student"}</h2>"""

new_header = """            <>
              {/* Header */}
              <div className="h-16 border-b border-white/[0.06] bg-[#131D2E] flex items-center justify-between px-6 shrink-0 relative z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden">
                    {displayList.find(s => s.id === activeThreadId)?.avatar ? (
                      <img src={displayList.find(s => s.id === activeThreadId)?.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-[#B6C2D9]" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-white font-semibold leading-tight">{displayList.find(s => s.id === activeThreadId)?.name || "Student"}</h2>"""

content = content.replace(old_header, new_header)

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
