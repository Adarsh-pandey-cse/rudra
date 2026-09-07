import re

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'onClick={() => handleSaveGrade("accepted")}',
    'onClick={() => handleSaveGrade("accepted")}\n                          loading={isSubmittingGrade && selectedSubmission.sub.status !== "rejected" && selectedSubmission.sub.status !== "resubmission_requested"}'
)

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
