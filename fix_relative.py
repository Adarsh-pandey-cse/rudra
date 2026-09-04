import re

def fix_position(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # The string has both absolute and relative! 
    # Example: className="absolute inset-0 ... relative z-0"
    content = content.replace(' relative z-0">', ' z-0">')

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

fix_position("src/app/dashboard/student/chat/page.tsx")
fix_position("src/app/dashboard/teacher/chat/page.tsx")
