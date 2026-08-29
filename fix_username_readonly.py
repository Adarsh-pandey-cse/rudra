import re

with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_input = """<input type="text" required value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" />"""
new_input = """<input type="text" readOnly value={editUsername} title="Username cannot be changed after creation" className="w-full bg-white/[0.01] border border-white/[0.04] rounded-xl px-4 py-2 text-[#7B8798] outline-none cursor-not-allowed" />"""

content = content.replace(old_input, new_input)

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
