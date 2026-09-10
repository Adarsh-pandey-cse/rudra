import re

with open("src/app/dashboard/student/homework/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add pendingFiles state
if "const [pendingFiles, setPendingFiles]" not in content:
    content = content.replace(
        'const [studentAttachments, setStudentAttachments] = useState<Attachment[]>([]);',
        'const [studentAttachments, setStudentAttachments] = useState<Attachment[]>([]);\n  const [pendingFiles, setPendingFiles] = useState<{id: string, file: File}[]>([]);'
    )

# 2. Rewrite handleFileChange
handle_file_change_replacement = """    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const newPending = Array.from(files).map((file, i) => ({
        id: `temp_${Date.now()}_${i}`,
        file
      }));

      const placeholders: Attachment[] = newPending.map(p => ({
        id: p.id,
        name: p.file.name || "Image",
        url: URL.createObjectURL(p.file),
        type: 'image',
        size: p.file.size || 0,
        uploadedAt: new Date().toISOString()
      }));
      
      setStudentAttachments(prev => [...prev, ...placeholders]);
      setPendingFiles(prev => [...prev, ...newPending]);
      
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    };"""

content = re.sub(
    r'const handleFileChange = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{.*?(?=\s*const handleSubmitSubjective)',
    handle_file_change_replacement + '\n\n',
    content,
    flags=re.DOTALL
)

# 3. Rewrite handleSubmitSubjective
submit_replacement = """  const handleSubmitSubjective = async () => {
      if (studentAttachments.length === 0 && !textResponse.trim()) {
        if (!confirm("You haven't attached any files or written a response. Submit anyway?")) return;
      }
      setIsSubmitting(true);
      setIsUploading(true);
      
      try {
        let finalAttachments = [...studentAttachments];
        
        if (pendingFiles.length > 0) {
          const filesArray = pendingFiles.map(p => p.file);
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
          
          // Replace placeholders with actual URLs
          const pendingIds = pendingFiles.map(p => p.id);
          finalAttachments = finalAttachments.filter(a => !pendingIds.includes(a.id));
          finalAttachments = [...finalAttachments, ...newAttachments];
        }

        await saveSubmissionDraft(homework.id, currentUser.id, textResponse, finalAttachments);
        await submitHomework(homework.id, currentUser.id);
        triggerSuccess();
      } catch (err: any) {
        console.error("Submission failed:", err);
        alert("Failed to submit: " + (err.message || err.toString()));
      } finally {
        setIsSubmitting(false);
        setIsUploading(false);
      }
    };"""

content = re.sub(
    r'const handleSubmitSubjective = async \(\) => \{.*?(?=\s*const triggerSuccess)',
    submit_replacement + '\n\n',
    content,
    flags=re.DOTALL
)

# 4. Handle attachment removal: if user deletes a pending file, remove it from pendingFiles array
# Wait, let's see how they remove an attachment.
content = content.replace(
    'setStudentAttachments(prev => prev.filter(a => a.id !== att.id));',
    'setStudentAttachments(prev => prev.filter(a => a.id !== att.id));\n                                  setPendingFiles(prev => prev.filter(p => p.id !== att.id));'
)

with open("src/app/dashboard/student/homework/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
