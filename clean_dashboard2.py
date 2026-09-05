import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False

for i in range(len(lines)):
    if "useEffect(() => {" in lines[i] and (i+1 < len(lines) and "if (currentUser" in lines[i+1]):
        # Start looking ahead to see if it's the Aastha block
        block = "".join(lines[i:i+15])
        if "Aastha" in block:
            skip = True
            
    if skip:
        if "}, [currentUser]);" in lines[i]:
            skip = False
        continue
        
    if "// One-time fix to restore" in lines[i]:
        continue
        
    new_lines.append(lines[i])

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
