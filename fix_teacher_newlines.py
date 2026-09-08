with open("src/app/dashboard/teacher/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("label: \"Create\nHomework\"", "label: \"Create\\nHomework\"")
content = content.replace("label: \"Check\nSubmissions\"", "label: \"Check\\nHomework\"")
content = content.replace("label: \"Student\nChats\"", "label: \"Student\\nChats\"")
content = content.replace("label: \"Post\nNotice\"", "label: \"Post\\nNotice\"")
content = content.replace("label: \"Review\nDoubts\"", "label: \"Review\\nDoubts\"")
content = content.replace("label: \"Mark\nAttendance\"", "label: \"Mark\\nAttendance\"")

with open("src/app/dashboard/teacher/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
