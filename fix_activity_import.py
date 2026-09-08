with open("src/app/dashboard/teacher/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('  Activity, useState, useEffect } from "react";', '  useState, useEffect } from "react";')
content = content.replace('import { \n  MessageSquare,', 'import { \n  Activity,\n  MessageSquare,')

with open("src/app/dashboard/teacher/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

with open("src/app/dashboard/student/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

if 'import { \n  Activity,\n  PlayCircle,' not in content:
    content = content.replace('import {\n  PlayCircle,', 'import {\n  Activity,\n  PlayCircle,')

with open("src/app/dashboard/student/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
