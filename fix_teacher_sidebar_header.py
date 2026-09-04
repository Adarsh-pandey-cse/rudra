import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Make sure Link is imported
if 'import Link from "next/link"' not in content:
    content = 'import Link from "next/link";\n' + content

# Add back button to sidebar header
old_sidebar_header = '<h2 className="text-lg font-bold text-white mb-4">Student Chats</h2>'
new_sidebar_header = """<div className="flex items-center gap-3 mb-4">
                <Link href="/dashboard/teacher" className="md:hidden p-2 -ml-2 hover:bg-white/[0.1] rounded-full text-[#B6C2D9] transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h2 className="text-lg font-bold text-white">Student Chats</h2>
              </div>"""

content = content.replace(old_sidebar_header, new_sidebar_header)

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
