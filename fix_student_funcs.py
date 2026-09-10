import re

with open("src/app/dashboard/student/homework/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

restore_code = """
  const removeStudentAttachment = async (id: string) => {
    const updatedAttachments = studentAttachments.filter(a => a.id !== id);
    setStudentAttachments(updatedAttachments);
    setPendingFiles(prev => prev.filter(p => p.id !== id));
    if (!isCompleted) {
      await saveSubmissionDraft(homework.id, currentUser.id, textResponse, updatedAttachments);
    }
  };
  
  const handleTextChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTextResponse(newText);
    if (!isCompleted) {
      await saveSubmissionDraft(homework.id, currentUser.id, newText, studentAttachments);
    }
  };

  const handleSubmitSubjective = async () => {"""

content = content.replace("  const handleSubmitSubjective = async () => {", restore_code, 1)

with open("src/app/dashboard/student/homework/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
