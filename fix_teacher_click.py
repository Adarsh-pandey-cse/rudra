import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# I will wrap the createThreadIfMissing in try-catch so that if rules fail, we still switch active thread!
old_click = """  const handleStudentClick = async (studentId: string, studentName: string, studentAvatar?: string) => {
    await createThreadIfMissing(studentId, studentName, studentAvatar);
    setActiveThreadId(studentId);
    setSearch("");
  };"""

new_click = """  const handleStudentClick = async (studentId: string, studentName: string, studentAvatar?: string) => {
    try {
      await createThreadIfMissing(studentId, studentName, studentAvatar);
    } catch (e) {
      console.error("Could not create thread upfront (might be rules), continuing anyway:", e);
    }
    setActiveThreadId(studentId);
    setSearch("");
  };"""
content = content.replace(old_click, new_click)

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
