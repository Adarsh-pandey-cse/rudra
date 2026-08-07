"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useDoubtStore } from "@/store/doubtStore";
import { useDataStore } from "@/store/dataStore";
import { uploadService } from "@/lib/services/upload.service";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import { ArrowLeft, Send, Camera, UploadCloud, X, User as UserIcon, ChevronDown, Paperclip } from "lucide-react";
import type { Student } from "@/types";
import type { Attachment } from "@/types/homework-types";

export default function AskDoubtPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  
  const { subjects } = useDataStore();
  const { askDoubt } = useDoubtStore();

  const [selectedSubject, setSelectedSubject] = useState("");

  const [question, setQuestion] = useState("");
  const [attachments, setAttachments] = useState<(Attachment & { file?: File, preview?: string })[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"compose" | "escalated">("compose");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "student") {
      router.replace("/auth/login");
      return;
    }
    setMounted(true);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  if (!mounted || !currentUser) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = Array.from(files).map((file, i) => ({
      id: `att_${Date.now()}_${i}`,
      name: file.name,
      file, // Store actual File object
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : "",
      url: "",
      type: (file.type.startsWith('image/') ? 'image' : 'docx') as "image" | "pdf" | "docx" | "video" | "voice" | "link",
      uploadedAt: new Date().toISOString()
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = async () => {
    if (!selectedSubject || !question.trim()) return;
    
    setIsSubmitting(true);

    try {
      const doubtId = `doubt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      
      const newDoubt = {
        id: doubtId,
        studentId: currentUser.id,
        studentName: currentUser.name || "Student",
        subjectId: selectedSubject.toLowerCase(),
        subjectName: selectedSubject,
        classId: (currentUser as Student).classId,
        question: question,
        attachments: [],
        status: "pending",
        priority: "normal",
        isAiAnswered: false,
        hasTeacherFollowUp: false,
        resolutionStatus: "unresolved",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Optimistic UI (Local only)
      const { addLocalDoubt, createRemoteDoubt } = useDoubtStore.getState();
      addLocalDoubt(newDoubt as any);
      
      setStep("escalated");
      setIsSubmitting(false);

      // 2. Background Pipeline
      (async () => {
        try {
          const filesToUpload = attachments.filter(a => a.file).map(a => a.file as File);
          let uploadedAttachments: any[] = [];
          
          if (filesToUpload.length > 0) {
            const uploadedFiles = await uploadService.uploadFiles(filesToUpload, "doubts", "doubt", doubtId);
            uploadedAttachments = uploadedFiles.map(f => ({
              id: Math.random().toString(),
              name: f.name,
              type: f.type.startsWith("image/") ? "image" : f.type.includes("pdf") ? "pdf" : "docx",
              url: f.url,
              size: f.size,
              uploadedAt: new Date().toISOString()
            }));
          }

          // 3. Firestore Transaction
          const finalDoubt = {
            ...newDoubt,
            attachments: uploadedAttachments,
            status: "open" // finalized remote status
          };
          
          await createRemoteDoubt(finalDoubt as any);

        } catch (err: any) {
          console.error("[Upload Pipeline] Background doubt upload failed:", err);
          // Could dispatch a status update to local store if needed
        }
      })();

      setTimeout(() => {
        router.push("/dashboard/student/doubts");
      }, 2500);

    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="max-w-3xl mx-auto pb-24 px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.10] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">Ask a Doubt</h1>
        </div>

        <AnimatePresence mode="wait">
          {step === "compose" && (
            <motion.div
              key="compose"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <GlassCard className="p-6 sm:p-8 space-y-6">
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Subject</label>
                  <div className="relative">
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-[14px] px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#5B5CFF]/50 transition-colors"
                    >
                      <option value="" disabled className="bg-[#0F172A] text-[#7B8798]">Select a subject</option>
                      {subjects.map(sub => (
                        <option key={sub.id} value={sub.name} className="bg-[#0F172A]">{sub.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8798] pointer-events-none" />
                  </div>
                </div>



                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Your Question</label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Type your doubt here in detail..."
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[14px] px-4 py-4 text-sm text-white placeholder:text-[#7B8798] focus:outline-none focus:border-[#5B5CFF]/50 min-h-[120px] resize-y transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Attachments <span className="text-[#7B8798] font-normal">(Optional)</span></label>
                  
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-3">
                      {attachments.map(att => (
                        <div key={att.id} className="relative group">
                          {att.type === 'image' ? (
                            <div className="w-20 h-20 rounded-xl bg-[#131D2E] border border-white/[0.08] flex items-center justify-center overflow-hidden">
                              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${att.preview || att.url})` }} />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-white/[0.04] border border-white/[0.08] flex flex-col items-center justify-center p-2 text-center">
                              <Paperclip className="w-6 h-6 text-[#7B8798] mb-1" />
                              <span className="text-[10px] text-[#B6C2D9] truncate w-full">{att.name}</span>
                            </div>
                          )}
                          <button
                            onClick={() => removeAttachment(att.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 border border-white/[0.08] rounded-[14px] bg-white/[0.02] py-4 flex flex-col items-center justify-center hover:bg-white/[0.04] transition-colors"
                    >
                      <UploadCloud className="w-6 h-6 text-[#7B8798] mb-2" />
                      <span className="text-sm text-white">Upload File</span>
                    </button>
                    <button 
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 border border-white/[0.08] rounded-[14px] bg-white/[0.02] py-4 flex flex-col items-center justify-center hover:bg-white/[0.04] transition-colors"
                    >
                      <Camera className="w-6 h-6 text-[#7B8798] mb-2" />
                      <span className="text-sm text-white">Take Photo</span>
                    </button>
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <GradientButton 
                    onClick={handleSubmit}
                    disabled={!selectedSubject || !question.trim() || isSubmitting}
                    className="px-8"
                  >
                    {!isSubmitting && <Send className="w-4 h-4 mr-2" />}
                    {isSubmitting ? "Sending..." : "Ask Teacher"}
                  </GradientButton>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {step === "escalated" && (
            <motion.div
              key="escalated"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                <UserIcon size={48} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Sent to Teacher!</h2>
              <p className="text-[#B6C2D9]">Your doubt has been forwarded to your subject teacher.</p>
              <p className="text-[13px] text-[#7B8798] mt-4 font-medium uppercase tracking-wider">Redirecting...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
