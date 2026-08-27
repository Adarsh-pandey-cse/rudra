import re

with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add success message state
content = content.replace(
    'const [editError, setEditError] = useState("");',
    'const [editError, setEditError] = useState("");\n  const [successMessage, setSuccessMessage] = useState("");'
)

# Set success message on save
handleUpdate_end = """      setEditingStudentId(null);
    };"""

handleUpdate_new_end = """      setEditingStudentId(null);
      setSuccessMessage(`${editName} details updated successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    };"""
content = content.replace(handleUpdate_end, handleUpdate_new_end)

# Change inline edit modal to overlay modal
old_modal_start = """        {/* Edit Modal */}
        <AnimatePresence>
          {editingStudentId && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: "auto" }} 
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <GlassCard className="p-6">"""

new_modal_start = """        {/* Edit Modal (Popup) */}
        <AnimatePresence>
          {editingStudentId && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl"
            >
              <GlassCard className="p-6 md:p-8">"""

content = content.replace(old_modal_start, new_modal_start)

# Close overlay wrapper
old_modal_end = """                  </form>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>"""

new_modal_end = """                  </form>
              </GlassCard>
            </motion.div>
            </div>
          )}
        </AnimatePresence>"""

content = content.replace(old_modal_end, new_modal_end)

# Render success message
success_toast = """        {/* Success Popup */}
        <AnimatePresence>
          {successMessage && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-md shadow-[0_0_20px_rgba(34,197,94,0.2)]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium text-sm">{successMessage}</span>
              </motion.div>
            </div>
          )}
        </AnimatePresence>"""

content = content.replace("        {/* Filters Row */}", success_toast + "\n\n        {/* Filters Row */}")

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
