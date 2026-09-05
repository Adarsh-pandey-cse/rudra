import re

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix the modal wrapping
old_structure = """      {/* Submission Detail Modal */}
      <AnimatePresence>
        {selectedSubmission && mounted && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">"""

new_structure = """      {/* Submission Detail Modal */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedSubmission && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">"""

content = content.replace(old_structure, new_structure)


old_end = """              </motion.div>
            </div>,
            document.body
          )}
      </AnimatePresence>"""

new_end = """              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}"""

content = content.replace(old_end, new_end)

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
