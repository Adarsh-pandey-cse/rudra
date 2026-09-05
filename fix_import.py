import re

with open("src/app/dashboard/student/homework/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add Calendar to lucide-react imports if it's missing
import_pattern = r'import \{([^}]+)\} from "lucide-react";'
match = re.search(import_pattern, content)
if match:
    imports = match.group(1)
    if "Calendar" not in imports:
        new_imports = imports + ", Calendar"
        content = content.replace(match.group(0), f'import {{{new_imports}}} from "lucide-react";')

with open("src/app/dashboard/student/homework/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
