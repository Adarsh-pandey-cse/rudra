import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add ArrowLeft import if missing
if "ArrowLeft" not in content:
    content = content.replace("User,", "User, ArrowLeft,")
    content = content.replace("Trash2 }", "Trash2, ArrowLeft }")

# Update Sidebar classes
old_sidebar = '<div className="w-80 border-r border-white/[0.06] flex flex-col bg-[#070D19] shrink-0">'
new_sidebar = '<div className={cn("w-full md:w-80 border-r border-white/[0.06] flex flex-col bg-[#070D19] shrink-0", activeThreadId ? "hidden md:flex" : "flex")}>'
content = content.replace(old_sidebar, new_sidebar)

# Update Main Chat Area classes
old_main = '<div className="flex-1 flex flex-col relative bg-[#0B1527] min-w-0">'
new_main = '<div className={cn("flex-1 flex flex-col relative bg-[#0B1527] min-w-0", !activeThreadId ? "hidden md:flex" : "flex")}>'
content = content.replace(old_main, new_main)

# Add Back Button to Header
old_header = """                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden">"""
new_header = """                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveThreadId(null)}
                    className="md:hidden p-2 -ml-2 hover:bg-white/[0.1] rounded-full text-[#B6C2D9] transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden">"""
content = content.replace(old_header, new_header)

# Fix image overflow in Teacher chat
old_img = 'className="max-w-full h-auto cursor-zoom-in hover:opacity-90 transition-opacity"'
new_img = 'className="max-w-full max-h-[300px] object-contain rounded-lg bg-black/20 cursor-zoom-in hover:opacity-90 transition-opacity"'
content = content.replace(old_img, new_img)

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
