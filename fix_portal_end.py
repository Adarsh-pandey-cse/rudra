import re

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Current end block:
#            </div>,
#            document.body
#          )}
#      </AnimatePresence>

# We want:
#            </div>
#          )}
#        </AnimatePresence>,
#        document.body
#      )}

old_end = r'            </div>,\n            document.body\n          \)}\n        </AnimatePresence>'
new_end = '            </div>\n          )}\n        </AnimatePresence>,\n        document.body\n      )}'
content = re.sub(old_end, new_end, content)

# Check if it was without indentation
old_end2 = r'            </div>,\n            document.body\n          \)}\n      </AnimatePresence>'
new_end2 = '            </div>\n          )}\n        </AnimatePresence>,\n        document.body\n      )}'
content = re.sub(old_end2, new_end2, content)

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
