import re

with open("src/app/dashboard/teacher/homework/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = re.compile(r'<button className="text-xs font-bold bg-gradient-to-r from-\[\#5B5CFF\]/10[^>]+>\s*View Submissions\s*</button>', re.DOTALL)

def replacer(match):
    original = match.group(0)
    if "onClick" not in original:
        return original.replace("<button ", "<button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/teacher/homework/analytics/${assignment.id}`); }} ")
    return original

content = pattern.sub(replacer, content)

with open("src/app/dashboard/teacher/homework/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
