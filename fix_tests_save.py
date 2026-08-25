import re

with open("src/app/dashboard/teacher/tests/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

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
      }
    };'''

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
      }
    };'''

if 'const editId = editingMarks[studentId];' not in content:
    content = content.replace(old_save, new_save)

with open("src/app/dashboard/teacher/tests/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
