import re

with open("src/app/dashboard/student/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("setOnlineStatus(currentUser.id, \"student\", currentUser.name, true);", "")
content = content.replace("setOnlineStatus(currentUser.id, \"student\", currentUser.name, false);", "")

with open("src/app/dashboard/student/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
