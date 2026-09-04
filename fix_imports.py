import re

def fix_imports(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Clean up duplicate imports from lucide-react
    lucide_match = re.search(r'import \{([^\}]+)\} from "lucide-react";', content)
    if lucide_match:
        items = [x.strip() for x in lucide_match.group(1).split(',')]
        unique_items = list(dict.fromkeys(items)) # preserve order
        
        # Make sure ArrowLeft and Download are in there
        if "ArrowLeft" not in unique_items:
            unique_items.append("ArrowLeft")
        if "Download" not in unique_items:
            unique_items.append("Download")
            
        new_import = "import { " + ", ".join(unique_items) + ' } from "lucide-react";'
        content = content[:lucide_match.start()] + new_import + content[lucide_match.end():]
        
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

fix_imports("src/app/dashboard/student/chat/page.tsx")
fix_imports("src/app/dashboard/teacher/chat/page.tsx")
