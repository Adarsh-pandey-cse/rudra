"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Send, Image as ImageIcon, Check, CheckCheck, Loader2, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentChatPage() {
  const { currentUser } = useAuthStore();
  const { 
    threads, 
    messages, 
    initializeStudentThreadListener, 
    initializeMessagesListener,
    sendMessage,
    markAsRead,
    setTypingStatus,
    setOnlineStatus,
    setActiveThreadId,
    deleteMessage,
    clearChat
  } = useChatStore();

  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const thread = threads[0]; // Student only has one thread

  useEffect(() => {
    if (!currentUser) return;
    
    // Initialize listeners
    const unsubThread = initializeStudentThreadListener(currentUser.id, currentUser.name);
    const unsubMessages = initializeMessagesListener(currentUser.id, "student");
    setActiveThreadId(currentUser.id);
    setOnlineStatus(currentUser.id, "student", currentUser.name, true);

    return () => {
      unsubThread();
      unsubMessages();
      setActiveThreadId(null);
      setOnlineStatus(currentUser.id, "student", currentUser.name, false);
    };
  }, [currentUser]);

  // Mark messages as read when they arrive and window is focused
  useEffect(() => {
    if (!currentUser || !messages.length) return;
    const hasUnread = messages.some(m => m.senderRole !== "student" && m.status !== "read");
    if (hasUnread) {
      markAsRead(currentUser.id, "student");
    }
  }, [messages, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    
    if (currentUser && thread) {
      setTypingStatus(thread.id, "student", currentUser.name, true);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(thread.id, "student", currentUser.name, false);
      }, 2000);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || (!text.trim() && !attachment)) return;
    
    // If thread hasn't propagated to state yet due to rules, we use currentUser.id directly
    const targetThreadId = thread?.id || currentUser.id;
    
    setIsSending(true);
    try {
      await sendMessage(targetThreadId, text.trim(), {
        id: currentUser.id,
        role: "student",
        name: currentUser.name,
        avatar: currentUser.avatar
      }, attachment);
      setText("");
      setAttachment(null);
      setTypingStatus(targetThreadId, "student", currentUser.name, false);
    } catch(err) {
      console.error(err);
      alert("Failed to send message. Please ensure Firebase Firestore/Storage rules allow chats.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (currentUser && window.confirm("Delete this message?")) {
      await deleteMessage(currentUser.id, msgId);
    }
  };

  const handleClearChat = async () => {
    if (currentUser && window.confirm("Are you sure you want to delete this chat entirely? This cannot be undone.")) {
      await clearChat(currentUser.id);
    }
  };

  if (!currentUser) return null;

  return (
    <DashboardLayout role="student">
      <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-[#0B1527] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl relative z-0">
        
        {/* Chat Header */}
        <div className="h-16 border-b border-white/[0.06] bg-[#131D2E] flex items-center justify-between px-6 shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg shadow-lg">
              T
            </div>
            <div>
              <h2 className="text-white font-semibold leading-tight">Teacher Support</h2>
              <div className="text-xs text-[#7B8798] flex items-center gap-1.5 h-4">
                {thread?.typingIndicator?.teacher ? (
                  <span className="text-[#5B5CFF] font-medium animate-pulse">{thread.typingIndicator.teacher} is typing...</span>
                ) : thread?.onlineStatus?.teacher ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    <span className="text-[#B6C2D9]">Online</span>
                  </div>
                ) : (
                  <span>Typically replies within a few hours</span>
                )}
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleClearChat}
            title="Clear Chat History"
            className="w-10 h-10 rounded-full bg-white/[0.02] hover:bg-[#EF4444]/10 text-[#7B8798] hover:text-[#EF4444] flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 relative z-0">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[#7B8798] opacity-50">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                <Send className="w-8 h-8" />
              </div>
              <p>Say hello to your teachers!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderRole === "student";
              const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={cn("flex flex-col max-w-[75%] group", isMe ? "self-end items-end" : "self-start items-start")}
                >
                  {!isMe && showAvatar && (
                    <span className="text-[10px] text-[#7B8798] mb-1 ml-1">{msg.senderName}</span>
                  )}
                  
                  <div className="flex items-center gap-2 relative w-full justify-end">
                    {/* Delete Message Button */}
                    <button 
                      onClick={() => handleDeleteMessage(msg.id)}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-white/[0.06] text-[#7B8798] hover:text-[#EF4444] transition-all",
                        isMe ? "order-1" : "order-2"
                      )}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  
                    <div className={cn(
                      "relative px-4 py-2 rounded-2xl break-words whitespace-pre-wrap shadow-sm",
                      isMe 
                        ? "order-2 bg-[#5B5CFF] text-white rounded-br-sm" 
                        : "order-1 bg-[#131D2E] border border-white/[0.06] text-[#B6C2D9] rounded-bl-sm"
                    )}>
                      {msg.attachmentUrl && (
                        <div className="mb-2 -mx-2 -mt-1 overflow-hidden rounded-xl">
                          {msg.attachmentType === "image" ? (
                            <div className="relative group/img">
                              <img 
                                src={msg.attachmentUrl} 
                                alt="Attachment" 
                                className="max-w-full h-auto cursor-zoom-in hover:opacity-90 transition-opacity" 
                                onClick={() => setFullScreenImage(msg.attachmentUrl!)} 
                              />
                            </div>
                          ) : (
                            <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-black/20 hover:bg-black/40 transition-colors">
                              <span className="text-sm underline">Download Attachment</span>
                            </a>
                          )}
                        </div>
                      )}
                      {msg.text && <span className="text-[14px] leading-relaxed block">{msg.text}</span>}
                      
                      <div className={cn(
                        "flex items-center justify-end gap-1 mt-1 -mb-0.5", 
                        isMe ? "text-white/70" : "text-[#7B8798]"
                      )}>
                        <span className="text-[9px]">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          msg.status === "read" 
                            ? <CheckCheck className="w-3 h-3 text-[#38BDF8]" />
                            : <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#131D2E] border-t border-white/[0.06] relative z-10 shrink-0">
          <AnimatePresence>
            {attachment && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-3 inline-flex items-center gap-2 bg-[#0B1527] border border-white/[0.1] pl-2 pr-1 py-1 rounded-lg"
              >
                <div className="w-8 h-8 rounded bg-white/[0.04] flex items-center justify-center shrink-0">
                  {attachment.type.startsWith("image/") ? (
                    <img src={URL.createObjectURL(attachment)} alt="preview" className="w-full h-full object-cover rounded" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-[#7B8798]" />
                  )}
                </div>
                <span className="text-xs text-[#B6C2D9] max-w-[150px] truncate">{attachment.name}</span>
                <button onClick={() => setAttachment(null)} className="p-1 hover:bg-white/[0.1] rounded text-[#7B8798] hover:text-[#EF4444] transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSend} className="flex items-end gap-3">
            <label className="p-3 text-[#7B8798] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors rounded-xl cursor-pointer shrink-0 h-[46px] flex items-center justify-center">
              <input 
                type="file" 
                className="hidden" 
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => e.target.files?.[0] && setAttachment(e.target.files[0])}
              />
              <ImageIcon className="w-5 h-5" />
            </label>
            
            <div className="flex-1 relative bg-white/[0.04] rounded-xl border border-white/[0.06] focus-within:border-[#5B5CFF]/50 transition-colors">
              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={handleTextChange}
                className="w-full bg-transparent text-white text-sm px-4 py-3.5 outline-none"
              />
            </div>

            <button 
              type="submit"
              disabled={isSending || (!text.trim() && !attachment)}
              className="p-3 bg-gradient-to-r from-[#5B5CFF] to-[#8B5CF6] hover:opacity-90 disabled:opacity-50 text-white rounded-xl transition-all shrink-0 h-[46px] flex items-center justify-center shadow-lg"
            >
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
      
      {/* Full Screen Image Modal */}
      <AnimatePresence>
        {fullScreenImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setFullScreenImage(null)}
          >
            <button 
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              onClick={() => setFullScreenImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(fullScreenImage, '_blank'); }}>
               Download Original
            </div>
            <img src={fullScreenImage} alt="Full Screen" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
