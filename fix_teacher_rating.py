import re

with open("src/app/dashboard/teacher/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Filter teacher feedbacks for current month
old_feedback_logic = "const teacherFeedbacks = doubts.filter(d => d.resolvedBy === currentUser.id && typeof d.studentRating === 'number');"
new_feedback_logic = """const currentMonthStr = new Date().toISOString().substring(0, 7); // e.g. '2026-08'
    const teacherFeedbacks = doubts.filter(d => 
      d.resolvedBy === currentUser.id && 
      typeof d.studentRating === 'number' &&
      d.updatedAt && d.updatedAt.startsWith(currentMonthStr)
    );"""

content = content.replace(old_feedback_logic, new_feedback_logic)

with open("src/app/dashboard/teacher/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
