"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, Clock, Send,
  User, GraduationCap, Star, AlertCircle,
  Paperclip, UploadCloud, X, Download,
  MessageCircleQuestion, Loader2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FileViewer from "@/components/ui/FileViewer";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import EmptyState from "@/components/ui/EmptyState";
import { useAuthStore } from "@/store/authStore";
import { useDoubtStore } from "@/store/doubtStore";
import type { DoubtReply, DoubtStatus } from "@/types/doubt-types";
import type { Attachment } from "@/types/homework-types";
import { format, isToday, isYesterday } from "date-fns";

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function formatMessageTime(dateStr: string) {
  return format(new Date(dateStr), "h:mm a");
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

function groupMessagesByDate(messages: DoubtReply[]) {
  const groups: { date: string; messages: DoubtReply[] }[] = [];
  let currentDate = "";
  for (const msg of messages) {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (dateKey !== currentDate) {
      currentDate = dateKey;
      groups.push({ date: msg.createdAt, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  open: { color: "text-[#FB923C]", bg: "bg-[#FB923C]/10", label: "Open" },
  resolved: { color: "text-[#22C55E]", bg: "bg-[#22C55E]/10", label: "Resolved" },
  teacher_answered: { color: "text-[#4F9DFF]", bg: "bg-[#4F9DFF]/10", label: "Answered" },
  escalated: { color: "text-[#EF4444]", bg: "bg-[#EF4444]/10", label: "Escalated" },
};

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function TeacherDoubtChatPage() {
  const router = useRouter();
  const params = useParams();
  const doubtId = params.id as string;

  const { currentUser, isAuthenticated, _hasHydrated, users } = useAuthStore();
  const { doubts, replies, teacherReply, resolveDoubt, setTyping, typingStatus, initializeRepliesListener } = useDoubtStore();

  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const doubt = doubts.find(d => d.id === doubtId);
  const chatMessages = replies
    .filter(r => r.doubtId === doubtId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [chatMessages.length, typingStatus, scrollToBottom]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "teacher") {
      // router.replace("/auth/login"); /* Handled by DashboardLayout */
      return;
    }
    setMounted(true);
    
    // Check if mobile for keyboard behavior
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  useEffect(() => {
    if (!doubtId) return;
    const unsubscribe = initializeRepliesListener(doubtId);
    return () => unsubscribe();
  }, [doubtId, initializeRepliesListener]);

  if (!mounted || !currentUser) return null;

  if (!doubt) {
    return (
      <DashboardLayout role="teacher">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <EmptyState
            icon={<AlertCircle className="w-12 h-12 text-[#EF4444]" />}
            title="Doubt Not Found"
            description="This doubt thread may have been removed."
            action={
              <GlassButton onClick={() => router.push("/dashboard/teacher/doubts")}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
              </GlassButton>
            }
          />
        </div>
      </DashboardLayout>
    );
  }

  // â”€â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSend = async () => {
    const content = text.trim();
    const currentAttachments = [...attachments];
    if (!content && currentAttachments.length === 0) return;

    setSending(true);
    setText("");
    setAttachments([]);
    setTyping(doubtId, null);

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";

    try {
      await teacherReply(doubtId, currentUser.id, currentUser.name, content, currentAttachments);
    } finally {
      setSending(false);
      // Only auto-focus on desktop, on mobile it keeps the keyboard open annoyingly
      if (!isMobile) {
        inputRef.current?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Desktop: Enter sends, Shift+Enter new line
    // Mobile: Enter new line, Send button sends
    if (e.key === "Enter" && !e.shiftKey && !isMobile) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
    setTyping(doubtId, "teacher");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(doubtId, null), 1500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAtts: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newAtts.push({
        id: `att_${Date.now()}_${i}`,
        name: file.name,
        url,
        type: file.type.startsWith("image/") ? "image" : "docx",
        uploadedAt: new Date().toISOString(),
      });
    }
    setAttachments(prev => [...prev, ...newAtts]);
    e.target.value = "";
  };

  const handleResolve = () => {
    resolveDoubt(doubtId, currentUser.id);
  };

  const status = statusConfig[doubt.status] || statusConfig.open;
  const messageGroups = groupMessagesByDate(chatMessages);
  const isStudentTyping = typingStatus[doubtId] === "student";

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <DashboardLayout role="teacher">
      <div className="fixed inset-0 top-[60px] lg:left-[260px] z-10 bg-[#07111F] flex flex-col pb-[84px] lg:pb-0">

        {/* â”€â”€ Chat Header â”€â”€ */}
        <div className="shrink-0 bg-[#0B1628]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center gap-3 z-10">
          <button
            onClick={() => router.push("/dashboard/teacher/doubts")}
            className="p-2 -ml-2 rounded-xl hover:bg-white/[0.06] text-[#7B8798] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={() => setShowInfo(!showInfo)}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md">
              {doubt.studentName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-white truncate">
                {doubt.studentName}
              </h2>
              <p className="text-[11px] text-[#7B8798] truncate">
                {isStudentTyping ? (
                  <span className="text-[#22C55E] font-medium">typing...</span>
                ) : (
                  <>Class {doubt.classId} â€¢ {doubt.subjectName} â€¢ {doubt.topicName || "General"}</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${status.color} ${status.bg}`}>
              {status.label}
            </span>
            {doubt.status !== "resolved" && (
              <button
                onClick={handleResolve}
                className="p-2 rounded-xl text-[#22C55E] hover:bg-[#22C55E]/10 transition-colors"
                title="Mark as Resolved"
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* â”€â”€ Info Panel (collapsible) â”€â”€ */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden shrink-0 border-b border-white/[0.06]"
            >
              <div className="p-4 bg-[#0B1628]/60 space-y-2">
                <div className="text-[11px] text-[#5B5CFF] font-semibold uppercase tracking-wider">Student&apos;s Original Question</div>
                <p className="text-sm text-[#B6C2D9] leading-relaxed whitespace-pre-wrap">{doubt.question}</p>
                {doubt.attachments && doubt.attachments.length > 0 && (
                  <div className="flex gap-2 pt-2 overflow-x-auto">
                    {doubt.attachments.map((att, i) => (
                      <button
                        key={i}
                        onClick={() => setViewingAttachment(att)}
                        className="w-16 h-16 rounded-xl bg-[#131D2E] border border-white/[0.08] overflow-hidden shrink-0 hover:border-[#5B5CFF]/50 transition-colors"
                      >
                        {att.type === "image" ? (
                          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${att.url})` }} />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full">
                            <Paperclip className="w-4 h-4 text-[#7B8798]" />
                            <span className="text-[8px] text-[#7B8798] mt-1 truncate w-full px-1 text-center">{att.name}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1 text-[11px] text-[#7B8798]">
                  <Clock className="w-3 h-3" />
                  Asked {format(new Date(doubt.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* â”€â”€ Messages Area â”€â”€ */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scroll-smooth bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgY3g9IjMwIiBjeT0iMzAiIHI9IjEiLz48L2c+PC9zdmc+')]">

          {/* System message: Original question */}
          <div className="flex justify-center mb-4">
            <div className="bg-[#131D2E]/80 backdrop-blur-sm border border-white/[0.06] rounded-xl px-4 py-2.5 max-w-[85%] text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <MessageCircleQuestion className="w-3.5 h-3.5 text-[#5B5CFF]" />
                <span className="text-[10px] font-semibold text-[#5B5CFF] uppercase tracking-wider">Student&apos;s Question</span>
              </div>
              <p className="text-[13px] text-[#B6C2D9] leading-relaxed text-left">{doubt.question}</p>
              
              {doubt.attachments && doubt.attachments.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 max-w-full custom-scrollbar">
                  {doubt.attachments.map((att, i) => (
                    <button
                      key={i}
                      onClick={() => setViewingAttachment(att)}
                      className="w-20 h-20 rounded-xl bg-black/40 border border-white/[0.08] overflow-hidden shrink-0 hover:border-[#5B5CFF]/50 transition-colors relative group"
                    >
                      {att.type === "image" ? (
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${att.url})` }} />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <Paperclip className="w-5 h-5 text-[#7B8798] mb-1" />
                          <span className="text-[9px] text-[#7B8798] truncate w-full px-2 text-center">{att.name}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[10px] font-medium">View</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date-grouped messages */}
          {messageGroups.map((group, gi) => (
            <div key={gi}>
              <div className="flex justify-center my-3">
                <span className="bg-[#131D2E]/80 text-[#7B8798] text-[10px] font-medium px-3 py-1 rounded-full border border-white/[0.06]">
                  {formatDateLabel(group.date)}
                </span>
              </div>

              {group.messages.map((msg) => {
                const isMe = msg.authorRole === "teacher";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`flex mb-1.5 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {/* Student avatar */}
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full shrink-0 mr-2 mt-1 shadow-md overflow-hidden">
                        <img src={users.find((u: any) => u.id === doubt.studentId)?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doubt.studentId}`} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className={`max-w-[78%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      {!isMe && (
                        <span className="text-[10px] font-semibold text-[#8B5CF6] ml-1 mb-0.5">{msg.authorName}</span>
                      )}

                      <div
                        className={`relative px-3 py-2 text-[13.5px] leading-relaxed shadow-sm ${
                          isMe
                            ? "bg-[#4F9DFF]/15 border border-[#4F9DFF]/25 text-white rounded-2xl rounded-tr-md"
                            : "bg-[#131D2E] border border-white/[0.08] text-[#E2E8F0] rounded-2xl rounded-tl-md"
                        }`}
                      >
                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className={`flex gap-1.5 flex-wrap ${msg.content ? "mt-2" : ""}`}>
                            {msg.attachments.map((att, ai) => (
                              <button
                                key={ai}
                                onClick={() => setViewingAttachment(att)}
                                className="w-24 h-24 rounded-xl overflow-hidden border border-white/[0.1] hover:border-[#5B5CFF]/50 transition-colors"
                              >
                                {att.type === "image" ? (
                                  <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${att.url})` }} />
                                ) : (
                                  <div className="w-full h-full bg-[#0B1628] flex flex-col items-center justify-center">
                                    <Paperclip className="w-5 h-5 text-[#7B8798] mb-1" />
                                    <span className="text-[8px] text-[#7B8798] px-1 truncate w-full text-center">{att.name}</span>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                          <span className="text-[9px] text-[#7B8798]/70">{formatMessageTime(msg.createdAt)}</span>
                          {isMe && <CheckCircle2 className="w-2.5 h-2.5 text-[#4F9DFF]/50" />}
                        </div>
                      </div>
                    </div>
                    {isMe && (
                      <div className="w-7 h-7 rounded-full shrink-0 ml-2 mt-1 shadow-md overflow-hidden">
                        <img src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id}`} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}

          {/* Typing indicator */}
          {isStudentTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start mb-2"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] flex items-center justify-center shrink-0 mr-2 mt-1 text-white font-bold text-xs">
                {doubt.studentName.charAt(0)}
              </div>
              <div className="bg-[#131D2E] border border-white/[0.08] rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#8B5CF6] rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-[#8B5CF6] rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-[#8B5CF6] rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Resolve trigger (Teacher only) */}
          {doubt.status === "teacher_answered" && (
            <div className="flex justify-center my-4">
              <button 
                onClick={handleResolve}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/20 hover:scale-105 transition-all text-sm font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark as Resolved
              </button>
            </div>
          )}

          {/* Resolved badge - Royal Style */}
          {doubt.status === "resolved" && doubt.studentRating && (
            <div className="flex justify-center my-6 pb-4">
              <div className="relative group bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#FBBF24]/20 rounded-3xl p-5 shadow-2xl overflow-hidden max-w-sm w-full transition-transform hover:scale-[1.02] duration-300">
                {/* Glow effects */}
                <div className="absolute -inset-2 bg-gradient-to-r from-[#FB923C]/20 via-transparent to-[#FBBF24]/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
                
                <div className="flex flex-col items-center relative z-10">
                  <div className="relative mb-3">
                    {/* Tilted Royal Star */}
                    <Star className="w-14 h-14 fill-[#FBBF24] text-[#FBBF24] -rotate-12 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] group-hover:rotate-0 transition-transform duration-500 ease-out" />
                    <div className="absolute -top-1 -right-3 bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/20 shadow-lg tracking-wider">
                      SOLVED
                    </div>
                  </div>
                  
                  <h3 className="text-[#FBBF24] font-semibold text-sm mb-2 tracking-wide uppercase shadow-sm">{doubt.studentRating! / 2} Star Rated</h3>
                  
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star 
                        key={s} 
                        className={`w-5 h-5 transition-all duration-300 ${s <= (doubt.studentRating! / 2) ? "fill-[#FBBF24] text-[#FBBF24] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" : "text-white/10"}`} 
                      />
                    ))}
                  </div>
                  
                  {doubt.studentFeedback && (
                    <div className="w-full bg-black/20 rounded-2xl p-3 border border-white/5 backdrop-blur-md relative mt-1">
                      <div className="absolute -top-2 left-4 text-2xl text-[#FBBF24]/40 font-serif leading-none">"</div>
                      <p className="text-[13px] text-center text-[#E2E8F0] italic font-medium leading-relaxed px-4">
                        {doubt.studentFeedback}
                      </p>
                      <div className="absolute -bottom-4 right-4 text-2xl text-[#FBBF24]/40 font-serif leading-none rotate-180">"</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* â”€â”€ Input Bar â”€â”€ */}
        {doubt.status !== "resolved" ? (
          <div className="shrink-0 border-t border-white/[0.06] bg-[#0B1628]/95 backdrop-blur-xl px-2 py-2 lg:px-4 lg:py-3 z-20">
            {/* Attachment preview */}
            {attachments.length > 0 && (
              <div className="flex gap-2 pb-2 mb-2 border-b border-white/[0.06] overflow-x-auto">
                {attachments.map(att => (
                  <div key={att.id} className="relative shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-[#131D2E] border border-white/[0.08] overflow-hidden flex items-center justify-center">
                      {att.type === "image" ? (
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${att.url})` }} />
                      ) : (
                        <Paperclip className="w-4 h-4 text-[#7B8798]" />
                      )}
                    </div>
                    <button
                      onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-lg hover:bg-[#DC2626] transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-full text-[#7B8798] hover:text-white hover:bg-white/[0.06] transition-colors mb-0.5"
              >
                <UploadCloud className="w-5 h-5" />
              </button>

              <textarea
                ref={inputRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your response..."
                rows={1}
                className="flex-1 bg-[#131D2E] border border-white/[0.08] rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-[#7B8798]/60 focus:outline-none focus:border-[#5B5CFF]/40 transition-colors resize-none max-h-[120px] overflow-y-auto"
              />

              <button
                onClick={handleSend}
                disabled={sending || (!text.trim() && attachments.length === 0)}
                className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#4F9DFF] to-[#5B5CFF] flex items-center justify-center text-white shadow-lg shadow-[#4F9DFF]/20 hover:shadow-[#4F9DFF]/40 disabled:opacity-30 disabled:shadow-none transition-all active:scale-90 mb-0.5"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-0.5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[10px] text-[#7B8798]">
                Responding as <span className="font-medium text-white">{currentUser.name}</span>
              </span>
              <span className="text-[10px] text-[#7B8798]">Shift+Enter for new line</span>
            </div>
          </div>
        ) : (
          <div className="shrink-0 border-t border-white/[0.06] bg-[#0B1628]/95 px-4 py-3 text-center">
            <p className="text-[13px] text-[#7B8798]">This doubt has been resolved</p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" onChange={handleFileUpload} multiple accept="image/*,.pdf,.doc,.docx" className="hidden" />

      {/* â”€â”€ Attachment Viewer Modal â”€â”€ */}
      <AnimatePresence>
        {viewingAttachment && (
          <FileViewer 
            url={viewingAttachment.url}
            name={viewingAttachment.name}
            type={viewingAttachment.type || (viewingAttachment.url.startsWith('data:image/') ? 'image' : 'other')}
            onClose={() => setViewingAttachment(null)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}


