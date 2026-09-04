import re

for filename in ["src/app/dashboard/student/chat/page.tsx", "src/app/dashboard/teacher/chat/page.tsx"]:
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()
    
    content = content.replace("useRef<NodeJS.Timeout>()", "useRef<NodeJS.Timeout | null>(null)")
    
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
