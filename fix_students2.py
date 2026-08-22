import re

with open('src/app/dashboard/teacher/tests/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the student filter practically indestructible
new_filter = """  const currentStudents = students.filter(s => {
    const gradeStr = ((s as any).grade || "").toString().toLowerCase();
    const classIdStr = ((s as any).classId || "").toString().toLowerCase();
    const target = selectedClass.toString().toLowerCase();
    
    return gradeStr === target || 
           gradeStr === target + "th" ||
           gradeStr === target + "st" ||
           gradeStr === target + "nd" ||
           gradeStr === target + "rd" ||
           gradeStr === "class " + target ||
           gradeStr === "class-" + target ||
           classIdStr === "class-" + target || 
           classIdStr === target ||
           gradeStr.includes(target) || 
           classIdStr.includes(target);
  });"""

content = re.sub(
    r'const currentStudents = students\.filter\(s => \{[\s\S]*?\}\);',
    new_filter,
    content
)

with open('src/app/dashboard/teacher/tests/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
