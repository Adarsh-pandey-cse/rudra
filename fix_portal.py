import re

with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Make sure createPortal is imported
if "createPortal" not in content:
    content = content.replace("import { motion, AnimatePresence } from \"framer-motion\";", "import { motion, AnimatePresence } from \"framer-motion\";\nimport { createPortal } from \"react-dom\";")

old_edit_modal = """        {/* Edit Modal */}
        <AnimatePresence>"""

new_edit_modal = """        {/* Edit Modal */}
        {mounted && typeof document !== 'undefined' && createPortal(
          <AnimatePresence>"""

content = content.replace(old_edit_modal, new_edit_modal)

old_edit_modal_end = """                  </form>
                </GlassCard>
              </motion.div>
            </div>
          )}
        </AnimatePresence>"""

new_edit_modal_end = """                  </form>
                </GlassCard>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
        )}"""

content = content.replace(old_edit_modal_end, new_edit_modal_end)

# Also wrap success popup in portal
old_success = """        {/* Success Popup */}
        <AnimatePresence>"""

new_success = """        {/* Success Popup */}
        {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>"""
content = content.replace(old_success, new_success)

old_success_end = """              </motion.div>
            </div>
          )}
        </AnimatePresence>"""

new_success_end = """              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
        )}"""
content = content.replace(old_success_end, new_success_end)

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
