import re

with open("src/app/dashboard/student/homework/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace pendingFiles logic with a robust base64 caching logic or immediate upload without blocking UI.
# Let's use immediate upload without blocking UI, but we track individual file progress if needed, or just let them upload in background.

# Find the handleFileChange and remove pendingFiles logic completely.
new_handler = """  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Do NOT block UI. Let user take more photos immediately.
    // We will show a toast or just append them as they finish.
    
    // Create temporary placeholders so they show up instantly in the grid
    const tempIds = Array.from(files).map((f, i) => `temp_${Date.now()}_${i}`);
    const placeholders: Attachment[] = Array.from(files).map((file, i) => ({
      id: tempIds[i],
      name: file.name || "Uploading...",
      url: URL.createObjectURL(file), // Local preview
      type: 'image',
      size: file.size || 0,
      uploadedAt: new Date().toISOString()
    }));
    
    setStudentAttachments(prev => [...prev, ...placeholders]);
    
    // Clear inputs so they can take another photo immediately
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";

    try {
      const filesArray = Array.from(files);
      const uploadedFiles = await uploadService.uploadFiles(
        filesArray,
        "homework",
        "homework",
        homework.id
      );

      const newAttachments: Attachment[] = uploadedFiles.map((f, i) => ({
        id: `att_${Date.now()}_${i}`,
        name: f.name,
        url: f.url,
        type: 'image',
        size: f.size || 0,
        uploadedAt: new Date().toISOString()
      }));

      // Replace placeholders with real attachments
      setStudentAttachments(prev => {
        const filtered = prev.filter(p => !tempIds.includes(p.id));
        const updated = [...filtered, ...newAttachments];
        
        // Auto-save draft
        if (!isCompleted) {
          saveSubmissionDraft(homework.id, currentUser.id, textResponse, updated).catch(console.error);
        }
        return updated;
      });
      
    } catch (err: any) {
      console.error("Upload failed:", err);
      // Remove placeholders on failure
      setStudentAttachments(prev => prev.filter(p => !tempIds.includes(p.id)));
      alert("Failed to upload files: " + (err.message || err.toString()));
    }
  };
  
  const removePendingFile = (id: string) => {};"""

# We need to replace the current handleFileChange and removePendingFile.
# Using regex to replace from "const handleFileChange = " up to the end of "removePendingFile"
pattern = re.compile(r'const handleFileChange = \(e: React\.ChangeEvent<HTMLInputElement>\) => \{.*?\};\s*const removePendingFile = \(id: string\) => \{.*?\};', re.DOTALL)
content = pattern.sub(new_handler, content)

# Update handleSubmitSubjective to just use studentAttachments
submit_pattern = re.compile(r'const handleSubmitSubjective = async \(\) => \{.*?finally \{\s*setIsSubmitting\(false\);\s*\}\s*\};', re.DOTALL)
submit_new = """const handleSubmitSubjective = async () => {
    // Check if there are any uploading placeholders
    if (studentAttachments.some(a => a.id.startsWith('temp_'))) {
      alert("Please wait for all images to finish uploading before submitting.");
      return;
    }

    if (studentAttachments.length === 0 && !textResponse.trim()) {
      if (!confirm("You haven't attached any files or written a response. Submit anyway?")) return;
    }
    setIsSubmitting(true);
    try {
      await saveSubmissionDraft(homework.id, currentUser.id, textResponse, studentAttachments);
      await submitHomework(homework.id, currentUser.id);
      triggerSuccess();
    } catch (err: any) {
      console.error("Submission failed:", err);
      alert("Failed to submit: " + (err.message || err.toString()));
    } finally {
      setIsSubmitting(false);
    }
  };"""
content = submit_pattern.sub(submit_new, content)

# Remove pendingFiles from UI rendering
ui_pattern = re.compile(r'\{\/\* Render pending local files \*\/}.*?\{\/\* Hidden inputs for Subjective uploads \*\/\}', re.DOTALL)
ui_new = """{/* Hidden inputs for Subjective uploads */}"""
content = ui_pattern.sub(ui_new, content)

# Fix the condition rendering the grid
content = content.replace("{(studentAttachments.length > 0 || pendingFiles.length > 0) && (", "{studentAttachments.length > 0 && (")

# Remove pendingFiles state
content = content.replace("const [pendingFiles, setPendingFiles] = useState<{ id: string, file: File, previewUrl: string, name: string }[]>([]);", "")

with open("src/app/dashboard/student/homework/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
