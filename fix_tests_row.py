import re

with open('src/app/dashboard/teacher/tests/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the student row styling
content = content.replace(
    '<div className="flex items-center gap-4">',
    '<div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">'
)

content = content.replace(
    '<img src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`} alt={student.name} className="w-12 h-12 rounded-full border border-white/10" />',
    '<img src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`} alt={student.name} className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 shrink-0 object-cover" />'
)

# Remove the ID and make the name truncate
content = re.sub(
    r'<div>\s*<h3 className="font-semibold text-white">\{student\.name\}</h3>\s*<p className="text-sm text-\[#7B8798\]">ID: \{student\.id\}</p>\s*</div>',
    '<div className="min-w-0 flex-1"><h3 className="font-semibold text-white truncate text-sm md:text-base">{student.name}</h3></div>',
    content
)

# Ensure the right side (input) is shrink-0
content = content.replace(
    '<div className="flex items-center gap-3">',
    '<div className="flex items-center gap-2 md:gap-3 shrink-0">'
)

# Adjust the input width slightly for mobile
content = content.replace(
    'className="w-24 bg-[#131D2E] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-[#5B5CFF] focus:ring-1 focus:ring-[#5B5CFF] outline-none text-right font-medium"',
    'className="w-20 md:w-24 bg-[#131D2E] border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-white focus:border-[#5B5CFF] focus:ring-1 focus:ring-[#5B5CFF] outline-none text-right font-medium text-sm md:text-base"'
)

with open('src/app/dashboard/teacher/tests/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
