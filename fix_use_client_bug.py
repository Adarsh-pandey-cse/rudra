import re

def fix_use_client(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # If "use client"; is not the very first thing, fix it.
    if '"use client";' in content:
        # Remove all instances of "use client";
        content = content.replace('"use client";', '')
        content = content.replace("'use client';", '')
        # Add it back at the very top
        content = '"use client";\n' + content.strip()
        
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

fix_use_client("src/app/dashboard/student/chat/page.tsx")
