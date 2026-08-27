import re

with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add Success Popup
if "successMessage &&" not in content:
    success_toast = """
        {/* Success Popup */}
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
        </AnimatePresence>
"""
    # Insert it right before the main container end or before return
    content = content.replace("      </div>\n    </div>\n  );\n}", success_toast + "\n      </div>\n    </div>\n  );\n}")

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
