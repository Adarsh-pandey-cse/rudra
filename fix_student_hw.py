import re

with open("src/app/dashboard/student/homework/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('useState("Pending");', 'useState("All");')

with open("src/app/dashboard/student/homework/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
