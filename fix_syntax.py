import re

def fix_iife(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # The issue is the end of the ternary expression inside the IIFE wasn't closed properly
    content = content.replace(
        "              );\n            });\n          })()}",
        "              );\n            })\n          );\n          })()}"
    )
    content = content.replace(
        "                      );\n                    });\n                  })()}",
        "                      );\n                    })\n                  );\n                  })()}"
    )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

fix_iife("src/app/dashboard/student/chat/page.tsx")
fix_iife("src/app/dashboard/teacher/chat/page.tsx")
