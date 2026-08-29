import re

with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the groupedStudents sort
content = re.sub(
    r'// Sort keys alphabetically\s*return Object\.keys\(groups\)\.sort\(\)\.reduce\(\(obj, key\) => \{',
    r'// Sort keys numerically for classes\n      return Object.keys(groups).sort((a, b) => {\n        const numA = parseInt(a.replace(/[^0-9]/g, "")) || 999;\n        const numB = parseInt(b.replace(/[^0-9]/g, "")) || 999;\n        if (numA !== numB) return numA - numB;\n        return a.localeCompare(b);\n      }).reduce((obj, key) => {',
    content
)

# Replace the exportGrouped sort
content = re.sub(
    r'Object\.keys\(exportGrouped\)\.sort\(\)\.forEach\(className => \{',
    r'Object.keys(exportGrouped).sort((a, b) => {\n        const numA = parseInt(a.replace(/[^0-9]/g, "")) || 999;\n        const numB = parseInt(b.replace(/[^0-9]/g, "")) || 999;\n        if (numA !== numB) return numA - numB;\n        return a.localeCompare(b);\n      }).forEach(className => {',
    content
)

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
