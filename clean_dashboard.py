import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove the first script
content = re.sub(r'  useEffect\(\(\) => \{\n    if \(currentUser\?\.role === "teacher"\) \{\n      import\("firebase/firestore"\)\.then.*?\{ points: 20 \}\);\n              \}\n            \}\n          \}\);\n        \}\);\n      \}\n    \}, \[currentUser\]\);\n\n', '', content, flags=re.DOTALL)

# Remove the second script
content = re.sub(r'  // One-time fix to restore Aastha\'s 40 points\n  useEffect\(\(\) => \{\n    if \(currentUser\) \{\n      import\("firebase/firestore"\)\.then.*?\{ points: 40 \}\);\n              \}\n            \}\n          \}\);\n        \}\);\n      \}\n    \}, \[currentUser\]\);\n\n', '', content, flags=re.DOTALL)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
