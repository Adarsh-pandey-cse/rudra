import re

with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix Email Input
content = content.replace(
    '<input type="email" required value={editUsername}',
    '<input type="text" required value={editUsername}'
)

# Fix Class / Grade Input to be a dropdown
old_class_input = """<input type="text" required value={editClassId} onChange={e => setEditClassId(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors" />"""
new_class_input = """<select value={editClassId} onChange={e => setEditClassId(e.target.value)} className="w-full bg-[#131D2E] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors appearance-none">
                            {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"].map((g) => (
                              <option key={g} value={`class-${g}`}>Class {g}</option>
                            ))}
                            {["6th", "7th", "8th", "9th", "10th", "11th", "12th"].map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>"""
content = content.replace(old_class_input, new_class_input)

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
