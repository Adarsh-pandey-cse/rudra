import os

# 1. Update Teacher Notes
with open('src/app/dashboard/teacher/notes/page.tsx', 'r', encoding='utf-8') as f:
    notes_content = f.read()

notes_content = notes_content.replace(
    'import { BookOpen,',
    'import { createPortal } from "react-dom";\nimport UploadProgressRing from "@/components/ui/UploadProgressRing";\nimport { BookOpen,'
)

notes_content = notes_content.replace(
    '<AnimatePresence>\n        {showUploadModal && (',
    '{typeof document !== "undefined" && createPortal(\n          <AnimatePresence>\n          {showUploadModal && ('
)
notes_content = notes_content.replace(
    '<AnimatePresence>\n          {showUploadModal && (',
    '{typeof document !== "undefined" && createPortal(\n          <AnimatePresence>\n          {showUploadModal && ('
)

notes_content = notes_content.replace(
    '</div>\n          </AnimatePresence>',
    '</div>\n            )}\n          </AnimatePresence>,\n          document.body\n        )}'
)
notes_content = notes_content.replace(
    '</motion.div>\n          </div>\n          </AnimatePresence>',
    '</motion.div>\n          </div>\n            )}\n          </AnimatePresence>,\n          document.body\n        )}'
)


import re
# Replace the Uploading button with UploadProgressRing
notes_content = re.sub(
    r'\{uploadState === "uploading" \? \([\s\S]*?\) : "Upload Document"\}',
    '{uploadState === "uploading" ? <UploadProgressRing progress={uploadProgress} /> : "Upload Document"}',
    notes_content
)

with open('src/app/dashboard/teacher/notes/page.tsx', 'w', encoding='utf-8') as f:
    f.write(notes_content)


# 2. Update Student Homework
with open('src/app/dashboard/student/homework/[id]/page.tsx', 'r', encoding='utf-8') as f:
    student_hw = f.read()

student_hw = student_hw.replace(
    'import ZoomableImage from "@/components/ui/ZoomableImage";',
    'import ZoomableImage from "@/components/ui/ZoomableImage";\nimport UploadProgressRing from "@/components/ui/UploadProgressRing";'
)

student_hw = re.sub(
    r'<div className="w-20 h-20 relative mb-6">[\s\S]*?</div>\s*<h3 className="text-xl font-bold text-white mb-2">Uploading Securely</h3>\s*<p className="text-sm text-\[\#7B8798\]">Please wait while we process your homework image\.\.\.</p>',
    '<div className="mb-6 scale-150"><UploadProgressRing /></div>',
    student_hw
)

student_hw = re.sub(
    r'\) : isUploading \? \(\s*<>\s*<div className="p-3 bg-white/\[0\.04\] rounded-full mb-3">[\s\S]*?</div>\s*<p className="text-sm text-\[\#4F9DFF\] mb-1 font-medium">Uploading images\.\.\.</p>\s*<p className="text-\[11px\] text-\[\#7B8798\] uppercase tracking-wider">Please wait</p>\s*</>\s*\) : \(',
    ') : isUploading ? (<UploadProgressRing />) : (',
    student_hw
)

with open('src/app/dashboard/student/homework/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(student_hw)


# 3. Update Teacher Homework
with open('src/app/dashboard/teacher/homework/create/page.tsx', 'r', encoding='utf-8') as f:
    teacher_hw = f.read()

teacher_hw = teacher_hw.replace(
    'import { uploadService } from "@/lib/services/upload.service";',
    'import { uploadService } from "@/lib/services/upload.service";\nimport UploadProgressRing from "@/components/ui/UploadProgressRing";'
)

teacher_hw = re.sub(
    r'<div className="w-20 h-20 relative mb-6">[\s\S]*?</div>\s*<h3 className="text-xl font-bold text-white mb-2">Publishing Assignment</h3>\s*<p className="text-sm text-\[\#7B8798\]">Please wait while we upload the assignment and materials\.\.\.</p>',
    '<div className="mb-6 scale-150"><UploadProgressRing /></div>',
    teacher_hw
)

with open('src/app/dashboard/teacher/homework/create/page.tsx', 'w', encoding='utf-8') as f:
    f.write(teacher_hw)


# 4. Update Teacher Notices
with open('src/app/dashboard/teacher/notices/create/page.tsx', 'r', encoding='utf-8') as f:
    notices_content = f.read()

notices_content = notices_content.replace(
    'import { useRouter } from "next/navigation";',
    'import { useRouter } from "next/navigation";\nimport { toast } from "sonner";'
)
notices_content = notices_content.replace(
    'if (!title.trim()) return;',
    'if (!title.trim()) { toast.error("Please enter a notice title"); return; }'
)
notices_content = notices_content.replace(
    'if (!body.trim() && attachments.length === 0) return;',
    'if (!body.trim() && attachments.length === 0) { toast.error("Please enter notice content or attach a file"); return; }'
)
notices_content = notices_content.replace(
    'console.error("Failed to publish notice", error);',
    'console.error("Failed to publish notice", error); toast.error("Failed to publish notice. Please try again.");'
)

with open('src/app/dashboard/teacher/notices/create/page.tsx', 'w', encoding='utf-8') as f:
    f.write(notices_content)

