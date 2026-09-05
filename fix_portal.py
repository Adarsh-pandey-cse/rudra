import re

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add createPortal import
if "createPortal" not in content:
    content = content.replace(
        'import { motion, AnimatePresence } from "framer-motion";',
        'import { motion, AnimatePresence } from "framer-motion";\nimport { createPortal } from "react-dom";'
    )

# 2. Add mounted state to prevent hydration mismatch with portal
if "const [mounted, setMounted] = useState(false);" not in content:
    content = re.sub(
        r'(const router = useRouter\(\);)',
        r'\1\n  const [mounted, setMounted] = useState(false);\n  useEffect(() => setMounted(true), []);',
        content
    )

# 3. Replace Modal start
old_modal_start = r'\{selectedSubmission && \(\s*<div className="fixed inset-0 z-\[100\] flex items-center justify-center'
new_modal_start = r'{selectedSubmission && mounted && createPortal(\n            <div className="fixed inset-0 z-[100] flex items-center justify-center'
content = re.sub(old_modal_start, new_modal_start, content)

# 4. Replace Modal end
old_modal_end = r'(</motion\.div>\s*</div>)\s*\)\}'
new_modal_end = r'\1,\n            document.body\n          )}'
content = re.sub(old_modal_end, new_modal_end, content)

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
