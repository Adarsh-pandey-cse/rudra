with open("src/store/usageStore.ts", "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace('@/lib/firebase/config', '@/lib/firebase/firebase')
with open("src/store/usageStore.ts", "w", encoding="utf-8") as f:
    f.write(content)

with open("src/app/dashboard/student/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()
# Revert Activity duplicates
content = content.replace('import { Activity, ', 'import { ')
# Only inject once
if "import { Activity" not in content:
    content = content.replace('import {\n  PlayCircle,', 'import {\n  Activity,\n  PlayCircle,')
with open("src/app/dashboard/student/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

with open("src/app/dashboard/teacher/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()
# Revert Activity missing children in teacher page?
# Ah wait! `<Activity className="w-8 h-8" />` might be conflicting if Activity was imported incorrectly!
# In teacher/page.tsx:
# `src/app/dashboard/teacher/page.tsx(240,22): error TS2741: Property 'children' is missing in type '{ className: string; }' but required in type 'ActivityProps'.`
# This means `Activity` was imported from `lucide-react` but then there is a component named `Activity`?
