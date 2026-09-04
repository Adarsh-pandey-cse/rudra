with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

if '"use client";' in content:
    content = content.replace('"use client";', '')
    content = content.replace("'use client';", '')
    content = '"use client";\n' + content.strip()
    
with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
