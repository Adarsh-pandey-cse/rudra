import re

with open('src/app/dashboard/teacher/tests/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<div className="p-5 md:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">',
    '<div className="p-5 md:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 text-center sm:text-left">'
)

content = content.replace(
    '<h2 className="text-xl font-bold text-white">Enter Marks for {selectedSubject.name}</h2>',
    '<h2 className="text-xl md:text-2xl font-bold text-white">Enter Marks for {selectedSubject.name}</h2>'
)

with open('src/app/dashboard/teacher/tests/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
