"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { ArrowLeft, Paperclip, CheckCircle2, X } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GradientButton from "@/components/ui/GradientButton";
import { useAuthStore } from "@/store/authStore";
import { useNoticeStore } from "@/store/noticeStore";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function CreateNoticePage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const { createNotice } = useNoticeStore();
  
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<"medium" | "high" | "critical">("medium"); // "medium" = Info, "high" = Low Important, "critical" = Important
  const [duration, setDuration] = useState<string>("24"); // "1", "24", or "forever"
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      router.replace("/auth/login");
      return;
    }
    setMounted(true);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  if (!mounted || !currentUser) return null;

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (!body.trim() && attachments.length === 0) return;
    
    let expiresAt: string | undefined = undefined;
    if (duration !== "forever") {
      const hours = parseInt(duration, 10);
      expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    }

    createNotice({
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      title,
      body,
      shortBody: body.substring(0, 100),
      type: "announcement",
      priority: priority,
      target: "all",
      attachments: attachments.map(f => ({
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: f.name,
        type: f.type.startsWith('image') ? 'image' : f.type.includes('pdf') ? 'pdf' : 'link',
        url: URL.createObjectURL(f),
        size: f.size,
        mimeType: f.type,
        uploadedAt: new Date().toISOString()
      })),
      publishMode: "immediate",
      isPinned: false,
      status: "published",
      expiresAt: expiresAt
    });
    router.push("/dashboard/teacher/notices");
  };

  const inputClasses = "w-full bg-white/[0.04] border border-white/[0.08] rounded-[14px] px-4 py-3 text-sm text-white placeholder:text-[#7B8798] focus:outline-none focus:ring-2 focus:ring-[#5B5CFF]/50 transition-all";
  const labelClasses = "text-[11px] text-[#7B8798] uppercase tracking-wider font-medium block mb-2";

  return (
    <DashboardLayout role="teacher">
      <motion.div 
        className="max-w-4xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-[14px] bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-[#7B8798] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Notice</h1>
            <p className="text-sm text-[#B6C2D9] mt-1">Broadcast important announcements to your class.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
            <GlassCard className="p-6 space-y-5">
              <GlassInput 
                label="Title" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="E.g. Science Fair Registration" 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Importance</label>
                  <select 
                    value={priority} 
                    onChange={e => setPriority(e.target.value as any)}
                    className={inputClasses}
                  >
                    <option value="medium">Information (Blue)</option>
                    <option value="high">Low Important (Yellow)</option>
                    <option value="critical">Important (Red)</option>
                  </select>
                </div>
                
                <div>
                  <label className={labelClasses}>Visibility Duration</label>
                  <select 
                    value={duration} 
                    onChange={e => setDuration(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="1">1 Hour</option>
                    <option value="24">24 Hours</option>
                    <option value="forever">Until I Delete</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Content</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className={`${inputClasses} h-40 resize-none`}
                  placeholder="Write your announcement here..."
                />
              </div>

              <div>
                <label className={labelClasses}>Attachments</label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  onChange={(e) => {
                    if (e.target.files) {
                      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }} 
                />
                
                {attachments.length > 0 && (
                  <div className="flex flex-col gap-2 mb-4">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-[12px] bg-white/[0.04] border border-white/[0.08]">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Paperclip className="w-4 h-4 text-[#7B8798] flex-shrink-0" />
                          <span className="text-sm text-white truncate">{file.name}</span>
                          <span className="text-xs text-[#7B8798] whitespace-nowrap">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <button 
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 hover:bg-white/[0.1] rounded-full text-[#7B8798] hover:text-[#EF4444] transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/[0.12] rounded-[14px] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/[0.04] transition-colors"
                >
                  <div className="p-3 bg-white/[0.04] rounded-full mb-3">
                    <Paperclip className="w-5 h-5 text-[#7B8798]" />
                  </div>
                  <p className="text-sm text-white mb-1">Click to upload or drag and drop</p>
                  <p className="text-[11px] text-[#7B8798] uppercase tracking-wider font-medium">PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <GlassCard className="p-6 sticky top-24">
              <h2 className="text-sm font-semibold text-white mb-4">Live Preview</h2>
              <div className="p-5 rounded-[14px] bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    priority === 'critical' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                    priority === 'high' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                    'bg-[#3B82F6]/20 text-[#3B82F6]'
                  }`}>
                    {priority === 'critical' ? 'Important' : priority === 'high' ? 'Low Important' : 'Information'}
                  </span>
                  {duration !== 'forever' && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-white/5 text-[#7B8798]">
                      Expires in {duration}h
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white mb-2 leading-tight">{title || "Notice Title"}</h3>
                <p className="text-[13px] text-[#B6C2D9] whitespace-pre-wrap leading-relaxed">{body || "Content preview will appear here..."}</p>
              </div>

              <div className="mt-6 pt-6 border-t border-white/[0.08]">
                <GradientButton onClick={handleSubmit} className="w-full py-4 text-sm font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Publish Notice
                </GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
