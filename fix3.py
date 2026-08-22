import re

with open('src/app/dashboard/teacher/notes/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'</div>\s*\)\}\s*</AnimatePresence>',
    '</div>\n            )}\n          </AnimatePresence>,\n          document.body\n        )}',
    content,
    count=1
)

with open('src/app/dashboard/teacher/notes/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
