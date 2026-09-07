import re

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'onClick={() => handleSaveGrade("resubmission_requested")}',
    'onClick={() => handleSaveGrade("resubmission_requested")}\n                            disabled={isSubmittingGrade || teacherFeedback.trim().length < 5}'
)

content = content.replace(
    'onClick={() => handleSaveGrade("rejected")}',
    'onClick={() => handleSaveGrade("rejected")}\n                            disabled={isSubmittingGrade || teacherFeedback.trim().length < 5}'
)

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
