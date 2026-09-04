import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

if "import { MessageSquare" not in content and ", MessageSquare" not in content and "MessageSquare," not in content:
    content = content.replace('import {', 'import { MessageSquare,', 1)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
