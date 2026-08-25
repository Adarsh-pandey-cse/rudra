import re

with open("src/app/dashboard/teacher/tests/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_block = """        try {
          await addTestMark({
            studentId,
            teacherId: currentUser.id,
            classId: selectedClass,
            subjectId: selectedSubject.id,
            date: dateStr,
            marks,
            maxMarks: 20
          });
          successCount++;
        } catch (err) {}
      }

      setIsSubmitting(false);
      if (successCount > 0) {
        setMarksInputs({});
        toast.success("Saved \\ test marks successfully!");
      }
    };"""

new_block = """        try {
          const editId = editingMarks[studentId];
          if (editId) {
            await updateTestMark(editId, marks);
          } else {
            await addTestMark({
              studentId,
              teacherId: currentUser.id,
              classId: selectedClass,
              subjectId: selectedSubject.id,
              date: dateStr,
              marks,
              maxMarks: 20
            });
          }
          successCount++;
        } catch (err) {}
      }

      setIsSubmitting(false);
      if (successCount > 0) {
        setMarksInputs({});
        setEditingMarks({});
        toast.success(`Saved marks for ${successCount} student(s) successfully!`);
      }
    };"""

content = content.replace(old_block, new_block)

with open("src/app/dashboard/teacher/tests/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
