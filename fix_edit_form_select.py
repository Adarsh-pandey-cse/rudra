import re

with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the messy select with a cleaner one
new_class_input = """<select value={editClassId.replace('class-', '')} onChange={e => setEditClassId(e.target.value)} className="w-full bg-[#131D2E] border border-white/[0.08] rounded-xl px-4 py-2 text-white outline-none focus:border-[#5B5CFF]/50 transition-colors appearance-none">
                            {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"].map((g) => (
                              <option key={g} value={g}>Class {g}</option>
                            ))}
                          </select>"""
content = re.sub(
    r'<select value=\{editClassId\}.*?</select>',
    new_class_input,
    content,
    flags=re.DOTALL
)

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
