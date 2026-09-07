import re

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'const [teacherFeedback, setTeacherFeedback] = useState<string>("");',
    'const [teacherFeedback, setTeacherFeedback] = useState<string>("");\n  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);'
)

handle_save_pattern = re.compile(r'const handleSaveGrade = async.*?};', re.DOTALL)

new_handle_save = """const handleSaveGrade = async (status: "accepted" | "rejected" | "resubmission_requested") => {
    if (!selectedSubmission) return;
    
    // Prevent double submissions
    if (isSubmittingGrade) return;
    setIsSubmittingGrade(true);

    const gradeVal = teacherGrade === "" ? null : Number(teacherGrade);
    
    try {
      // Save to store
      await teacherReview(selectedSubmission.sub.id, gradeVal, teacherFeedback, status);
      
      // Close the modal directly to force live reliance on store and give a perfect workflow
      setSelectedSubmission(null);
    } catch (error: any) {
      console.error("Teacher Review Error:", error);
      alert(error.message || "Failed to submit review.");
    } finally {
      setIsSubmittingGrade(false);
    }
  };"""

content = handle_save_pattern.sub(new_handle_save, content)

with open("src/app/dashboard/teacher/homework/analytics/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
