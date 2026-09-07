import re

with open("src/app/dashboard/student/homework/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add pendingFiles state
state_old = """  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);"""

state_new = """  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Pending files to upload at the end
  const [pendingFiles, setPendingFiles] = useState<{ id: string, file: File, previewUrl: string, name: string }[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);"""

content = content.replace(state_old, state_new)

# 2. Modify handleFileChange
handler_old = """  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
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

      const updatedAttachments = [...studentAttachments, ...newAttachments];
      setStudentAttachments(updatedAttachments);
      
      // Auto-save draft
      if (!isCompleted) {
        await saveSubmissionDraft(homework.id, currentUser.id, textResponse, updatedAttachments);
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      alert("Failed to upload files: " + (err.message || err.toString()));
    } finally {
      setIsUploading(false);
    }
  };"""

handler_new = """  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPending = Array.from(files).map((file, i) => ({
      id: `pending_${Date.now()}_${i}`,
      file,
      name: file.name,
      previewUrl: URL.createObjectURL(file)
    }));

    setPendingFiles(prev => [...prev, ...newPending]);
    
    // Clear inputs so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };
  
  const removePendingFile = (id: string) => {
    setPendingFiles(prev => {
      const fileToRemove = prev.find(p => p.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(p => p.id !== id);
    });
  };"""

content = content.replace(handler_old, handler_new)

# 3. Modify handleSubmitSubjective
submit_old = """  const handleSubmitSubjective = async () => {
    if (studentAttachments.length === 0 && !textResponse.trim()) {
      if (!confirm("You haven't attached any files or written a response. Submit anyway?")) return;
    }
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload
      await saveSubmissionDraft(homework.id, currentUser.id, textResponse, studentAttachments);
      await submitHomework(homework.id, currentUser.id);
      triggerSuccess();
    } catch (err: any) {"""

submit_new = """  const handleSubmitSubjective = async () => {
    if (studentAttachments.length === 0 && pendingFiles.length === 0 && !textResponse.trim()) {
      if (!confirm("You haven't attached any files or written a response. Submit anyway?")) return;
    }
    setIsSubmitting(true);
    try {
      let finalAttachments = [...studentAttachments];
      
      // Upload any pending files first
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
        
        finalAttachments = [...finalAttachments, ...newAttachments];
        setStudentAttachments(finalAttachments);
        setPendingFiles([]); // Clear pending
      }
      
      await saveSubmissionDraft(homework.id, currentUser.id, textResponse, finalAttachments);
      await submitHomework(homework.id, currentUser.id);
      triggerSuccess();
    } catch (err: any) {"""

content = content.replace(submit_old, submit_new)

# 4. Update the UI to render pendingFiles
ui_old = """              {studentAttachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                    {studentAttachments.map((att) => (
                      <div key={att.id} className="relative group">
                        <button
                          onClick={() => setViewingAttachment(att)}
                          className="w-full aspect-square rounded-xl bg-[#131D2E] border border-white/[0.08] flex items-center justify-center overflow-hidden hover:border-[#5B5CFF]/50 transition-colors focus:outline-none"
                        >
                          {att.type === 'image' ? (
                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${att.url})` }} />
                          ) : (
                            <div className="flex flex-col items-center p-2 text-center">
                              <Paperclip className="w-6 h-6 text-[#7B8798] mb-2" />
                              <span className="text-[10px] text-[#B6C2D9] truncate w-full px-1">{att.name}</span>
                            </div>
                          )}
                        </button>
                        {!isCompleted && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeStudentAttachment(att.id); }}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}"""

ui_new = """              {(studentAttachments.length > 0 || pendingFiles.length > 0) && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                    {/* Render saved attachments */}
                    {studentAttachments.map((att) => (
                      <div key={att.id} className="relative group">
                        <button
                          onClick={() => setViewingAttachment(att)}
                          className="w-full aspect-square rounded-xl bg-[#131D2E] border border-white/[0.08] flex items-center justify-center overflow-hidden hover:border-[#5B5CFF]/50 transition-colors focus:outline-none"
                        >
                          {att.type === 'image' ? (
                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${att.url})` }} />
                          ) : (
                            <div className="flex flex-col items-center p-2 text-center">
                              <Paperclip className="w-6 h-6 text-[#7B8798] mb-2" />
                              <span className="text-[10px] text-[#B6C2D9] truncate w-full px-1">{att.name}</span>
                            </div>
                          )}
                        </button>
                        {!isCompleted && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeStudentAttachment(att.id); }}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* Render pending local files */}
                    {pendingFiles.map((pending) => (
                      <div key={pending.id} className="relative group">
                        <div className="w-full aspect-square rounded-xl bg-[#131D2E] border-2 border-dashed border-[#5B5CFF]/40 flex items-center justify-center overflow-hidden relative">
                          <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url(${pending.previewUrl})` }} />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/50 px-2 py-1 rounded">Pending</span>
                          </div>
                        </div>
                        {!isCompleted && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removePendingFile(pending.id); }}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-10"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}"""

content = content.replace(ui_old, ui_new)

with open("src/app/dashboard/student/homework/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
