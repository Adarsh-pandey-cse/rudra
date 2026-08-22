"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, Image as ImageIcon, File, Download, Eye, ChevronLeft, ArrowLeft, Folder } from "lucide-react";
import { useNoteStore } from "@/store/noteStore";
import { useAuthStore } from "@/store/authStore";
import { getSubjectsForClass } from "@/data/curriculum-index";
import { Note } from "@/types";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function StudentNotesPage() {
  const { notes, isLoading, initializeListeners } = useNoteStore();
  const { currentUser } = useAuthStore();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const rawClass = (currentUser as any).classId || (currentUser as any).grade;
    const classIdClean = rawClass ? rawClass.replace(/\D/g, '') : "11";
    const queryClassId = 'class-' + classIdClean;
    const unsub = initializeListeners("student", queryClassId);
    return () => unsub();
  }, [currentUser, initializeListeners]);

  // Derived subjects based on actual notes available
  const availableSubjectIds = Array.from(new Set(notes.map(n => n.subjectId)));
  const classIdClean = currentUser?.role === "student" ? ((currentUser as any).classId?.replace('class-', '') || (currentUser as any).grade?.replace(/\D/g, '')) : "11";
  const allSubjects = getSubjectsForClass(classIdClean);
  
  const subjectsWithNotes = allSubjects.filter(s => availableSubjectIds.includes(s.id));

  const filteredNotes = notes.filter(n => n.subjectId === selectedSubject);

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
      // Fallback
      window.open(url, '_blank');
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="max-w-6xl mx-auto space-y-8 pb-20 relative">
        {!selectedSubject && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">My Study Notes</h1>
            <p className="text-[#7B8798] mt-2">Access your class materials and revisions</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-[#7B8798]">Loading subjects...</div>
            ) : subjectsWithNotes.length === 0 ? (
               <div className="col-span-full py-12 text-center text-[#7B8798] bg-white/[0.02] border border-white/[0.05] rounded-3xl">
                No notes available for your class yet.
              </div>
            ) : (
              subjectsWithNotes.map(subject => {
                const noteCount = notes.filter(n => n.subjectId === subject.id).length;
                return (
                  <motion.button
                    key={subject.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSubject(subject.id)}
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
              })
            )}
          </div>
        </motion.div>
      )}

      {selectedSubject && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => setSelectedSubject(null)}
              className="p-3 bg-white/[0.03] hover:bg-white/[0.08] rounded-full transition-colors text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {allSubjects.find(s => s.id === selectedSubject)?.name} Notes
              </h1>
              <p className="text-[#7B8798] mt-1">View and download files</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredNotes.map(note => (
              <div key={note.id} className="bg-[#0F172A] border border-white/[0.08] p-5 sm:p-6 rounded-3xl flex flex-col h-full hover:border-[#5B5CFF]/30 transition-colors">
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
                      <Eye className="w-4 h-4" /> View
                    </button>
                  )}
                  <button 
                    onClick={() => handleDownload(note.fileUrl, note.fileName || note.title)}
                    className="flex-1 bg-[#5B5CFF]/10 hover:bg-[#5B5CFF]/20 text-[#5B5CFF] py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* File Viewer Modal */}
      <AnimatePresence>
        {viewingNote && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col"
          >
            <div className="flex justify-between items-center p-4 md:p-6 bg-black/50">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setViewingNote(null)}
                  className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-white font-semibold text-lg line-clamp-1">{viewingNote.title}</h2>
              </div>
              <button 
                onClick={() => handleDownload(viewingNote.fileUrl, viewingNote.fileName || viewingNote.title)}
                className="bg-[#5B5CFF] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#4f50e6] transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> <span>Download</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {viewingNote.fileType === "pdf" ? (
                <iframe 
                  src={viewingNote.fileUrl + "#toolbar=0"} 
                  className="w-full h-full max-w-5xl bg-white rounded-xl shadow-2xl"
                  title={viewingNote.title}
                />
              ) : viewingNote.fileType === "image" ? (
                <img 
                  src={viewingNote.fileUrl} 
                  alt={viewingNote.title} 
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                />
              ) : (
                <div className="text-white">Preview not available. Please download the file.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}


