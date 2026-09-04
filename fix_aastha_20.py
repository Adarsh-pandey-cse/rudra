import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_logic = 'if (data.name?.includes("Aastha") && data.points > 22) {'
new_logic = 'if (data.name?.includes("Aastha") && data.points !== 20) {'
content = content.replace(old_logic, new_logic)

old_update = 'await updateDoc(userDoc.ref, { points: 22 });'
new_update = 'await updateDoc(userDoc.ref, { points: 20 });'
content = content.replace(old_update, new_update)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
