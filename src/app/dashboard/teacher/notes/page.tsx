"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Upload, Trash2, FileText, Image as ImageIcon, File, X, Plus, CheckCircle2, Eye } from "lucide-react";
import { useNoteStore } from "@/store/noteStore";
import { useAuthStore } from "@/store/authStore";
import { CLASSES, getSubjectsForClass } from "@/data/curriculum-index";
import { toast } from "sonner";
import { Note } from "@/types";

export default function TeacherNotesPage() {
  const { notes, isLoading, initializeListeners, uploadNote, deleteNote } = useNoteStore();
  const { currentUser } = useAuthStore();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Study Notes</h1>
          <p className="text-[#7B8798] mt-2">Upload and manage class materials</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowUploadModal(true); }}
          className="bg-gradient-to-r from-[#5B5CFF] to-[#8B5CF6] text-white px-6 py-3 rounded-2xl font-semibold shadow-xl shadow-[#5B5CFF]/20 hover:shadow-[#5B5CFF]/40 transition-all flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Upload Note
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-[#7B8798]">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#7B8798] bg-white/[0.02] border border-white/[0.05] rounded-3xl">
            No notes uploaded yet. Click "Upload Note" to add one.
          </div>
        ) : (
          notes.map(note => (
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
                <p className="text-xs sm:text-sm text-[#7B8798] mb-2">Class {note.classId.replace('class-', '')} â€¢ {getSubjectsForClass(note.classId.replace('class-', '')).find(s => s.id === note.subjectId)?.name || note.subjectId}</p>
                <p className="text-xs sm:text-sm text-[#7B8798] mb-5">{new Date(note.uploadedAt).toLocaleDateString()}</p>
                
                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => window.open(note.fileUrl, '_blank')}
                    className="flex-1 bg-white/[0.03] hover:bg-white/[0.08] text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> <span className="hidden sm:inline">View</span>
                  </button>
                  <button 
                    onClick={() => {
                      if(confirm("Are you sure you want to delete this note for everyone?")) {
                        deleteNote(note).then(() => toast.success("Deleted")).catch(() => toast.error("Failed to delete"));
                      }
                    }}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </motion.div>
          ))
        )}
      </div>

      {/* Upload Modal (Centered, Glassmorphism) */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0F172A] border border-white/[0.1] p-6 md:p-8 rounded-3xl w-full max-w-xl shadow-2xl relative overflow-y-auto max-h-[90vh] m-4"
            >
              {/* Decorative gradients */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-[#5B5CFF]/20 blur-[80px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[#8B5CF6]/20 blur-[80px] rounded-full" />
              </div>

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight">Upload Note</h2>
                {uploadState !== "uploading" && (
                  <button onClick={handleCloseModal} className="p-2 text-[#7B8798] hover:text-white bg-white/[0.05] hover:bg-white/[0.1] rounded-full transition-all">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {uploadState === "success" ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Upload Complete!</h3>
                  <p className="text-[#7B8798] mb-8">The note is now available to students in Class {selectedClass}.</p>
                  <button 
                    onClick={handleCloseModal}
                    className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-medium transition-all"
                  >
                    OK
                  </button>
                </motion.div>
              ) : uploadState === "uploading" ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <h3 className="text-xl font-bold text-white mb-8">Uploading {file?.name}...</h3>
                  
                  {/* Circular Progress */}
                  <div className="relative w-32 h-32 mb-8">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle 
                        cx="50" cy="50" r="45" 
                        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" 
                      />
                      <circle 
                        cx="50" cy="50" r="45" 
                        fill="none" stroke="#5B5CFF" strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * uploadProgress) / 100}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-300 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{Math.round(uploadProgress)}%</span>
                    </div>
                  </div>
                  
                  <p className="text-[#7B8798]">Please do not close this window</p>
                </div>
              ) : (
                <form onSubmit={handleUpload} className="space-y-6 relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#B6C2D9] mb-2">Class</label>
                      <select 
                        value={selectedClass} 
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:border-[#5B5CFF]/50 transition-colors"
                      >
                        {CLASSES.map(c => (
                          <option key={c} value={c}>Class {c}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#B6C2D9] mb-2">Subject</label>
                      <select 
                        value={selectedSubjectId} 
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:border-[#5B5CFF]/50 transition-colors"
                      >
                        {getSubjectsForClass(selectedClass).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#B6C2D9] mb-2">Note Title</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Thermodynamics Part 1"
                      required
                      className="w-full bg-white/[0.02] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:border-[#5B5CFF]/50 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#B6C2D9] mb-2">File (PDF, Image, DOCX)</label>
                    <div className="relative border-2 border-dashed border-white/[0.1] rounded-2xl p-8 hover:border-[#5B5CFF]/50 hover:bg-[#5B5CFF]/5 transition-all text-center cursor-pointer group">
                      <input 
                        type="file" 
                        onChange={(e) => setFile(e.target.files?.[0] || null)} 
                        required 
                        accept=".pdf,image/*,.doc,.docx"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/[0.05] group-hover:bg-[#5B5CFF]/20 flex items-center justify-center text-[#B6C2D9] group-hover:text-[#5B5CFF] transition-colors">
                          <Upload className="w-6 h-6" />
                        </div>
                        {file ? (
                          <p className="text-white font-medium">{file.name}</p>
                        ) : (
                          <>
                            <p className="text-white font-medium group-hover:text-[#5B5CFF] transition-colors">Click or drag file to upload</p>
                            <p className="text-sm text-[#7B8798]">Supports PDF, PNG, JPG up to 10MB</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-[#5B5CFF] to-[#8B5CF6] text-white py-4 rounded-xl font-bold shadow-xl shadow-[#5B5CFF]/20 hover:shadow-[#5B5CFF]/40 hover:scale-[1.02] transition-all flex justify-center items-center gap-2"
                  >
                    <Upload className="w-5 h-5" /> Start Upload
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

