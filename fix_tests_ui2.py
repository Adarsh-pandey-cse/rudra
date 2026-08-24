import re

with open('src/app/dashboard/teacher/tests/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add editingMarks state and updateTestMark to imports
content = content.replace(
    'const { testMarks, addTestMark, deleteTestMark } = useTestStore();',
    'const { testMarks, addTestMark, updateTestMark, deleteTestMark } = useTestStore();'
)

if 'const [editingMarks' not in content:
    content = content.replace(
        'const [marksInputs, setMarksInputs] = useState<Record<string, string>>({});',
        'const [marksInputs, setMarksInputs] = useState<Record<string, string>>({});\n  const [editingMarks, setEditingMarks] = useState<Record<string, string>>({});'
    )

# Modify handleSaveMarks to use updateTestMark
old_save = '''        try {
          await addTestMark({
            studentId,
            teacherId: currentUser.id,
            classId: selectedClass,
            subjectId: selectedSubject.id,
            marks,
            maxMarks: 20,
            date: dateStr
          });
          successCount++;
        } catch (error) {
          console.error("Error saving for student:", studentId);
        }
      }

      setIsSubmitting(false);
      setMarksInputs({});
      if (successCount > 0) {
        toast.success(`Saved marks for ${successCount} student(s)`);
      }'''

new_save = '''        try {
          const editId = editingMarks[studentId];
          if (editId) {
            await updateTestMark(editId, marks);
          } else {
            await addTestMark({
              studentId,
              teacherId: currentUser.id,
              classId: selectedClass,
              subjectId: selectedSubject.id,
              marks,
              maxMarks: 20,
              date: dateStr
            });
          }
          successCount++;
        } catch (error) {
          console.error("Error saving for student:", studentId);
        }
      }

      setIsSubmitting(false);
      setMarksInputs({});
      setEditingMarks({});
      if (successCount > 0) {
        toast.success(`Saved marks for ${successCount} student(s)`);
      }'''

if 'const editId = editingMarks[studentId];' not in content:
    content = content.replace(old_save, new_save)

with open('src/app/dashboard/teacher/tests/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
