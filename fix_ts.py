import re

with open("src/app/dashboard/teacher/students/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
"""      await updateStudentProfile(editingStudentId, { 
        classId: editClassId, 
        grade: editClassId, 
        fatherName: editFatherName 
      });""",
"""      await updateStudentProfile(editingStudentId, { 
        classId: editClassId, 
        grade: editClassId, 
        fatherName: editFatherName 
      } as any);"""
)

with open("src/app/dashboard/teacher/students/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
