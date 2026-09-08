with open("src/app/dashboard/teacher/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import {\n  Users,\n  BookOpen,", "import {\n  MessageSquare,\n  Users,\n  BookOpen,")

with open("src/app/dashboard/teacher/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
