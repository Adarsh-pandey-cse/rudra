import re

with open('src/app/dashboard/teacher/tests/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'className="bg-[#5B5CFF] hover:bg-[#5B5CFF]/90 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"',
    'className="bg-[#5B5CFF] hover:bg-[#5B5CFF]/90 text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 w-full sm:w-auto shadow-lg shadow-[#5B5CFF]/20 active:scale-95"'
)

with open('src/app/dashboard/teacher/tests/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
