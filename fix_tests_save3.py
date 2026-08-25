import re

with open("src/app/dashboard/teacher/tests/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(
    r'try \{\s*await addTestMark\(\{.*?\}\);\s*successCount\+\+;\s*\} catch \(err\) \{\}\s*\}',
    '''try {
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
      }''',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'setIsSubmitting\(false\);\s*if \(successCount > 0\) \{\s*setMarksInputs\(\{\}\);\s*toast\.success\("Saved \\\\ test marks successfully!"\);\s*\}',
    '''setIsSubmitting(false);
      if (successCount > 0) {
        setMarksInputs({});
        setEditingMarks({});
        toast.success(`Saved marks for ${successCount} student(s) successfully!`);
      }''',
    content,
    flags=re.DOTALL
)

with open("src/app/dashboard/teacher/tests/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
