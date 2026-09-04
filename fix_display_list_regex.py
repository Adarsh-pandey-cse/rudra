import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix the display list logic
content = re.sub(
    r'// If no search, just show existing threads\s*const displayList = search \? allSearchable : threads\.map[^;]+;',
    '// Always show the full list so "Start a new chat" is visible\n  const displayList = allSearchable;',
    content
)

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
