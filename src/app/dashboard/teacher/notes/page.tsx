"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Upload, Trash2, FileText, Image as ImageIcon, File, X, Plus, CheckCircle2, Eye, Folder, ArrowLeft, ChevronLeft, Download } from "lucide-react";
import { useNoteStore } from "@/store/noteStore";
import { useAuthStore } from "@/store/authStore";
import { CLASSES, getSubjectsForClass } from "@/data/curriculum-index";
import { toast } from "sonner";
import { Note } from "@/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FileViewer from "@/components/ui/FileViewer";

export default function TeacherNotesPage() {
  const { notes, isLoading, initializeListeners, uploadNote, deleteNote } = useNoteStore();
  const { currentUser } = useAuthStore();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Upload Form State
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Navigation State
  const [viewState, setViewState] = useState<"classes" | "subjects" | "notes">("classes");
  const [viewClassId, setViewClassId] = useState<string | null>(null);
  const [viewSubjectId, setViewSubjectId] = useState<string | null>(null);
  
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = initializeListeners("teacher");
    return () => unsub();
  }, [currentUser, initializeListeners]);

  useEffect(() => {
    const subjects = getSubjectsForClass(selectedClass);
    if (subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [selectedClass]);

  const resetForm = () => {
    setTitle("");
    setFile(null);
    setUploadProgress(0);
    setUploadState("idle");
  };

  const handleCloseModal = () => {
    setShowUploadModal(false);
    setTimeout(resetForm, 300); // delay reset so animation is smooth
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || !selectedSubjectId || !currentUser) return;

    setUploadState("uploading");
    setUploadProgress(0);
    
    try {
      await uploadNote(
        file, 
        'class-' + selectedClass, 
        selectedSubjectId, 
        title, 
        currentUser.id,
        (progress) => setUploadProgress(progress)
      );
      setUploadState("success");
    } catch (error: any) {
      setUploadState("error");
      toast.error("Failed to upload note: " + error.message);
    }
  };

  const getFileIcon = (type: string) => {
    if (type === "pdf") return <FileText className="w-8 h-8 text-red-400" />;
    if (type === "image") return <ImageIcon className="w-8 h-8 text-blue-400" />;
    return <File className="w-8 h-8 text-gray-400" />;
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, '_blank');
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="max-w-6xl mx-auto space-y-8 pb-20 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Study Notes</h1>
          <p className="text-[#7B8798] mt-2">Manage and upload class materials</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowUploadModal(true); }}
          className="bg-gradient-to-r from-[#5B5CFF] to-[#8B5CF6] text-white px-6 py-3 rounded-2xl font-semibold shadow-xl shadow-[#5B5CFF]/20 hover:shadow-[#5B5CFF]/40 transition-all flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Upload Note
        </button>
      </div>

      {/* CLASSES VIEW */}
      {viewState === "classes" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {CLASSES.map(cls => {
              const noteCount = notes.filter(n => n.classId === `class-${cls}`).length;
              return (
                <motion.button
                  key={cls}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setViewClassId(cls);
                    setViewState("subjects");
                  }}
                  className="bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-white/[0.05] p-5 sm:p-6 rounded-3xl text-left hover:border-[#5B5CFF]/30 transition-all group flex flex-col items-center sm:items-start text-center sm:text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#5B5CFF]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-[#5B5CFF]/10 transition-colors" />
                  <div className="w-16 h-16 sm:w-12 sm:h-12 bg-[#5B5CFF]/10 text-[#5B5CFF] rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <Folder className="w-8 h-8 sm:w-6 sm:h-6 fill-[#5B5CFF]/20" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1">Class {cls}</h3>
                  <p className="text-xs sm:text-sm text-[#7B8798]">{noteCount} File{noteCount !== 1 ? 's' : ''}</p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* SUBJECTS VIEW */}
      {viewState === "subjects" && viewClassId && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => {
                setViewState("classes");
                setViewClassId(null);
              }}
              className="p-3 bg-white/[0.03] hover:bg-white/[0.08] rounded-full transition-colors text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Class {viewClassId} Subjects</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {getSubjectsForClass(viewClassId).map(subject => {
              const noteCount = notes.filter(n => n.classId === `class-${viewClassId}` && n.subjectId === subject.id).length;
              return (
                <motion.button
                  key={subject.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setViewSubjectId(subject.id);
                    setViewState("notes");
                  }}
                  className="bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-white/[0.05] p-5 sm:p-6 rounded-3xl text-left hover:border-[#5B5CFF]/30 transition-all group flex flex-col items-center sm:items-start text-center sm:text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#5B5CFF]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-[#5B5CFF]/10 transition-colors" />
                  <div className="w-16 h-16 sm:w-12 sm:h-12 bg-[#5B5CFF]/10 text-[#5B5CFF] rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <Folder className="w-8 h-8 sm:w-6 sm:h-6 fill-[#5B5CFF]/20" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1">{subject.name}</h3>
                  <p className="text-xs sm:text-sm text-[#7B8798]">{noteCount} File{noteCount !== 1 ? 's' : ''}</p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* NOTES VIEW */}
      {viewState === "notes" && viewClassId && viewSubjectId && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => {
                setViewState("subjects");
                setViewSubjectId(null);
              }}
              className="p-3 bg-white/[0.03] hover:bg-white/[0.08] rounded-full transition-colors text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {getSubjectsForClass(viewClassId).find(s => s.id === viewSubjectId)?.name} Notes
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-[#7B8798]">Loading notes...</div>
            ) : (
              (() => {
                const filteredNotes = notes.filter(n => n.classId === `class-${viewClassId}` && n.subjectId === viewSubjectId);
                
                if (filteredNotes.length === 0) {
                  return (
                    <div className="col-span-full py-12 text-center text-[#7B8798] bg-white/[0.02] border border-white/[0.05] rounded-3xl">
                      No notes uploaded for this subject yet.
                    </div>
                  );
                }

                return filteredNotes.map(note => (
                  <motion.div 
                    key={note.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#0F172A] border border-white/[0.08] p-5 sm:p-6 rounded-3xl flex flex-col h-full hover:border-[#5B5CFF]/30 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-white/[0.03] rounded-2xl">
                        {getFileIcon(note.fileType)}
                      </div>
                      <div className="text-[11px] sm:text-xs text-[#5B5CFF] font-medium bg-[#5B5CFF]/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-[#5B5CFF]/20">
                        {(note.sizeBytes / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1 flex-grow break-words">{note.title}</h3>
                    <p className="text-xs sm:text-sm text-[#7B8798] mb-5">{new Date(note.uploadedAt).toLocaleDateString()}</p>
                    
                    <div className="flex gap-2 sm:gap-3 mt-auto">
                      {(note.fileType === "pdf" || note.fileType === "image") && (
                        <button 
                          onClick={() => setViewingNote(note)}
                          className="flex-1 bg-white/[0.03] hover:bg-white/[0.08] text-white py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" /> <span>View</span>
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if(confirm("Are you sure you want to delete this note for everyone?")) {
                            deleteNote(note).then(() => toast.success("Deleted")).catch(() => toast.error("Failed to delete"));
                          }
                        }}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> <span>Delete</span>
                      </button>
                    </div>
                  </motion.div>
                ));
              })()
            )}
          </div>
        </motion.div>
      )}

        {/* File Viewer Modal */}
        <AnimatePresence>
          {viewingNote && (
            <FileViewer 
              url={viewingNote.fileUrl}
              name={viewingNote.fileName || viewingNote.title}
              type={viewingNote.fileType}
              onClose={() => setViewingNote(null)}
            />
          )}
        </AnimatePresence>
            {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0B1527] border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-md relative shadow-2xl my-auto"
            >
              <button 
                onClick={handleCloseModal}
                className="absolute top-6 right-6 text-[#7B8798] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold text-white mb-2">Upload Note</h2>
              <p className="text-[#7B8798] text-sm mb-6">Share a new document with your students.</p>

              {uploadState === "success" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-[#22C55E]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Upload Complete!</h3>
                  <p className="text-[#7B8798] mb-6">Your note has been successfully shared.</p>
                  <button 
                    onClick={handleCloseModal}
                    className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-medium transition-colors border border-white/10"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpload} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[#B6C2D9] mb-2">Target Class</label>
                    <select 
                      value={selectedClass} 
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full bg-[#131D2E] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#5B5CFF] focus:ring-1 focus:ring-[#5B5CFF] outline-none transition-all appearance-none"
                    >
                      {CLASSES.map(cls => (
                        <option key={cls} value={cls}>Class {cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#B6C2D9] mb-2">Subject</label>
                    <select 
                      value={selectedSubjectId} 
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full bg-[#131D2E] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#5B5CFF] focus:ring-1 focus:ring-[#5B5CFF] outline-none transition-all appearance-none"
                    >
                      {getSubjectsForClass(selectedClass).map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#B6C2D9] mb-2">Note Title</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Chapter 1: Chemical Reactions"
                      className="w-full bg-[#131D2E] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#5B5CFF] focus:ring-1 focus:ring-[#5B5CFF] outline-none transition-all placeholder:text-[#4A5568]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#B6C2D9] mb-2">Document File</label>
                    <label className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? 'border-[#5B5CFF]/50 bg-[#5B5CFF]/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}>
                      <input 
                        type="file" 
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                        accept=".pdf,image/*"
                      />
                      <Upload className={`w-8 h-8 mb-3 ${file ? 'text-[#5B5CFF]' : 'text-[#7B8798]'}`} />
                      {file ? (
                        <div className="text-center">
                          <p className="text-white font-medium line-clamp-1">{file.name}</p>
                          <p className="text-xs text-[#7B8798] mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-white font-medium">Click to browse or drag and drop</p>
                          <p className="text-xs text-[#7B8798] mt-1">PDF or Images up to 200MB</p>
                        </div>
                      )}
                    </label>
                  </div>

                  <button 
                    type="submit"
                    disabled={uploadState === "uploading" || !file || !title.trim()}
                    className="w-full bg-[#5B5CFF] hover:bg-[#5B5CFF]/90 disabled:bg-[#5B5CFF]/50 text-white py-3.5 rounded-xl font-bold transition-colors mt-2 shadow-lg shadow-[#5B5CFF]/20 relative overflow-hidden"
                  >
                    {uploadState === "uploading" ? (
                      <div className="flex flex-col items-center justify-center">
                        <span className="mb-1 text-sm">Uploading... {uploadProgress.toFixed(0)}%</span>
                        <div className="w-1/2 h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white transition-all duration-300" style={{ width: uploadProgress + '%' }} />
                        </div>
                      </div>
                    ) : "Upload Document"}
                  </button>
                  
                  {uploadState === "error" && (
                    <p className="text-red-400 text-sm text-center mt-2">Failed to upload. Please try again.</p>
                  )}
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}





