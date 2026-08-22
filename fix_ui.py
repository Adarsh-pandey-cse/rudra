import re

with open('src/app/dashboard/teacher/tests/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the header for mobile responsiveness
content = content.replace(
    '<div className="p-6 border-b border-white/5 flex items-center justify-between">',
    '<div className="p-5 md:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">'
)

# Fix the list items for better mobile alignment
content = content.replace(
    'className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"',
    'className="p-4 md:p-6 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"'
)

# Center the no students message properly
content = content.replace(
    '<div className="p-12 text-center text-[#7B8798]">No students found in Class {selectedClass}</div>',
    '<div className="p-12 text-center text-[#7B8798] flex flex-col items-center justify-center gap-2"><div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-2"><Users className="w-8 h-8 text-white/20" /></div><p>No students found in Class {selectedClass}</p></div>'
)

# Also fix the avatar seed string literal
content = content.replace(
    'src={student.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}"}',
    'src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`}'
)

with open('src/app/dashboard/teacher/tests/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
