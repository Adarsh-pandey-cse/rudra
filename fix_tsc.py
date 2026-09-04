import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix the map loop that was missed
content = content.replace(
    'messages.map((msg, idx) => {',
    'visibleMessages.map((msg, idx) => {'
)

# Fix onClick handleClearChat on line 301
# The Trash button was probably not replaced correctly, or there's another button.
content = content.replace(
    'onClick={handleClearChat}',
    'onClick={() => setShowClearDialog(true)}'
)

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

with open("src/app/dashboard/student/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix clearChat argument in Student
content = content.replace(
    'await clearChat(currentUser.id);',
    'await clearChat(currentUser.id, "student", "me");'
)

with open("src/app/dashboard/student/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

