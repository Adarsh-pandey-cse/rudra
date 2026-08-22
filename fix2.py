import re

with open('src/app/dashboard/teacher/notes/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'import { BookOpen,',
    'import { createPortal } from "react-dom";\nimport UploadProgressRing from "@/components/ui/UploadProgressRing";\nimport { BookOpen,'
)

# Replace start of AnimatePresence for the modal
content = re.sub(
    r'<AnimatePresence>\s*\{showUploadModal && \(',
    '{typeof document !== "undefined" && createPortal(\\n          <AnimatePresence>\\n          {showUploadModal && (',
    content
)

# Replace end of AnimatePresence for the modal
content = re.sub(
    r'</div>\s*</AnimatePresence>',
    '</div>\\n            )}\\n          </AnimatePresence>,\\n          document.body\\n        )}',
    content,
    count=1
)

# Replace the Uploading button with UploadProgressRing
content = re.sub(
    r'\{uploadState === "uploading" \? \([\s\S]*?\) : "Upload Document"\}',
    '{uploadState === "uploading" ? <UploadProgressRing progress={uploadProgress} /> : "Upload Document"}',
    content
)

with open('src/app/dashboard/teacher/notes/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
