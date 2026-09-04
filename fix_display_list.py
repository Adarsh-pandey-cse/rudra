import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix the display list logic
old_display_list = """    // If no search, just show existing threads
    const displayList = search ? allSearchable : threads.map(t => ({ id: t.id, name: t.studentName, avatar: t.studentAvatar, thread: t }));"""

new_display_list = """    // Always show the full list so "Start a new chat" is visible
    const displayList = allSearchable;"""

content = content.replace(old_display_list, new_display_list)

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
