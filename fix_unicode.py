with open("src/app/dashboard/student/chat/page.tsx", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

clean_lines = []
for line in lines:
    clean_line = line.replace('\ufffd', '')
    clean_lines.append(clean_line)
    
with open("src/app/dashboard/student/chat/page.tsx", "w", encoding="utf-8") as f:
    f.writelines(clean_lines)
