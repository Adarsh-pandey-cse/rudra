import re

with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_sort = """      // Sort keys alphabetically
      return Object.keys(groups).sort().reduce((obj, key) => {"""

new_sort = """      // Sort keys numerically for class grades
      return Object.keys(groups).sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, '')) || 999;
        const numB = parseInt(b.replace(/[^0-9]/g, '')) || 999;
        if (numA !== numB) return numA - numB;
        return a.localeCompare(b);
      }).reduce((obj, key) => {"""

content = content.replace(old_sort, new_sort)

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
