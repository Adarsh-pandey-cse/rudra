import re

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Pattern to find the end block
pattern = r'            </motion\.div>\n          </div>,\n            document\.body\n          \)}\n      </AnimatePresence>'

new_end = """            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}"""

content = re.sub(pattern, new_end, content)

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
