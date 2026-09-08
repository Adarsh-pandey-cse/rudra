import re

with open("src/app/dashboard/student/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(
    r'(const unsubMessages = initializeMessagesListener\(currentUser\.id, "student"\);\n\s*setActiveThreadId\(currentUser\.id\);)',
    r'\1\n    setOnlineStatus(currentUser.id, "student", currentUser.name, true);',
    content
)

content = re.sub(
    r'(unsubMessages\(\);\n\s*setActiveThreadId\(null\);)',
    r'\1\n      setOnlineStatus(currentUser.id, "student", currentUser.name, false);',
    content
)

with open("src/app/dashboard/student/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
