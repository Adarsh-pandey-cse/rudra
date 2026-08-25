import re

with open("src/app/dashboard/student/notes/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'const subjectsWithNotes = allSubjects.filter(s => availableSubjectIds.includes(s.id));',
    'const subjectsWithNotes = allSubjects.filter(s => availableSubjectIds.includes(s.id)).sort((a, b) => a.name.localeCompare(b.name));'
)

content = content.replace(
    'const filteredNotes = notes.filter(n => n.subjectId === selectedSubject);',
    'const filteredNotes = notes.filter(n => n.subjectId === selectedSubject).sort((a, b) => a.title.localeCompare(b.title));'
)

with open("src/app/dashboard/student/notes/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
