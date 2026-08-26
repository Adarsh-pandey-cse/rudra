import re

with open("src/app/dashboard/teacher/students/add/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    """    const res = await registerStudent(name, username, password, grade, parentPhone, fatherName);
    if (res.success) {
      const allUsers = getAllUsers();
      const newStudent = allUsers.find(u => u.username === username);
      
      if (newStudent) {""",
    """    const res = await registerStudent(name, username, password, grade, parentPhone, fatherName);
    if (res.success) {
      const studentId = res.studentId;
      
      if (studentId) {"""
)

content = content.replace(
    "studentId: newStudent.id,",
    "studentId: studentId,"
)

with open("src/app/dashboard/teacher/students/add/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
