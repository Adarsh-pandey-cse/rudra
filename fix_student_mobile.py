import re

with open("src/app/dashboard/student/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add ArrowLeft import if missing
if "ArrowLeft" not in content:
    content = content.replace("Image as ImageIcon,", "Image as ImageIcon, ArrowLeft,")

# Add Link import
if "Link" not in content:
    content = 'import Link from "next/link";\n' + content

# Add back button to student header
old_header = """          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg shadow-lg">"""
new_header = """          <div className="flex items-center gap-4">
            <Link href="/dashboard/student" className="md:hidden p-2 -ml-2 hover:bg-white/[0.1] rounded-full text-[#B6C2D9] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg shadow-lg">"""
content = content.replace(old_header, new_header)

# Fix image overflow in Student chat
old_img = 'className="max-w-full h-auto cursor-zoom-in hover:opacity-90 transition-opacity"'
new_img = 'className="max-w-full max-h-[300px] object-contain rounded-lg bg-black/20 cursor-zoom-in hover:opacity-90 transition-opacity"'
content = content.replace(old_img, new_img)

with open("src/app/dashboard/student/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
