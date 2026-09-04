"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Send, Image as ImageIcon, Check, CheckCheck, Loader2, X, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function TeacherChatPage() {
  const { currentUser } = useAuthStore();
  const { 
    threads, 
    activeThreadId,
    messages, 
    initializeTeacherThreadsListener, 
    initializeMessagesListener,
    sendMessage,
    markAsRead,
    setTypingStatus,
    setOnlineStatus,
    setActiveThreadId
  } = useChatStore();

  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubMessagesRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsubThreads = initializeTeacherThreadsListener();
    return () => {
      unsubThreads();
      if (unsubMessagesRef.current) unsubMessagesRef.current();
      if (activeThreadId) {
        setOnlineStatus(activeThreadId, "teacher", currentUser.name, false);
      }
      setActiveThreadId(null);
    };
  }, [currentUser]);

  // Handle switching active thread
  useEffect(() => {
    if (!currentUser || !activeThreadId) return;
    
    if (unsubMessagesRef.current) unsubMessagesRef.current();
    unsubMessagesRef.current = initializeMessagesListener(activeThreadId, "teacher");
    setOnlineStatus(activeThreadId, "teacher", currentUser.name, true);

    return () => {
      setOnlineStatus(activeThreadId, "teacher", currentUser.name, false);
    };
  }, [activeThreadId, currentUser]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    
    if (currentUser && activeThreadId) {
      setTypingStatus(activeThreadId, "teacher", currentUser.name, true);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(activeThreadId, "teacher", currentUser.name, false);
      }, 2000);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeThreadId || (!text.trim() && !attachment)) return;
    
    setIsSending(true);
    try {
      await sendMessage(activeThreadId, text.trim(), {
        id: currentUser.id,
        role: "teacher",
        name: currentUser.name,
        avatar: currentUser.avatar
      }, attachment);
      setText("");
      setAttachment(null);
      setTypingStatus(activeThreadId, "teacher", currentUser.name, false);
    } finally {
      setIsSending(false);
    }
  };

  const filteredThreads = threads.filter(t => t.studentName.toLowerCase().includes(search.toLowerCase()));

  if (!currentUser) return null;

  return (
    <DashboardLayout role="teacher">
      <div className="max-w-6xl mx-auto h-[calc(100vh-120px)] flex bg-[#0B1527] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Sidebar */}
        <div className="w-80 shrink-0 border-r border-white/[0.06] flex flex-col bg-[#070D19]">
          <div className="p-4 border-b border-white/[0.06]">
            <h2 className="text-lg font-bold text-white mb-4">Student Chats</h2>
            <div className="relative">
              <Search className="w-4 h-4 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search students..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.06] text-sm text-white rounded-xl pl-9 pr-4 py-2 outline-none focus:border-[#5B5CFF]/50 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#7B8798]">No chats found</div>
            ) : (
              filteredThreads.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={cn(
                    "w-full p-4 flex items-center gap-3 text-left transition-colors border-b border-white/[0.02]",
                    activeThreadId === thread.id ? "bg-[#5B5CFF]/10" : "hover:bg-white/[0.02]"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 relative">
                    {thread.studentAvatar ? (
                      <img src={thread.studentAvatar} alt={thread.studentName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-[#B6C2D9]" />
                    )}
                    {thread.onlineStatus?.student && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22C55E] border-2 border-[#070D19] rounded-full" />
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-sm font-semibold text-white truncate pr-2">{thread.studentName}</h3>
                      <span className="text-[10px] text-[#7B8798] shrink-0">
                        {new Date(thread.lastMessageTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={cn(
                        "text-xs truncate", 
                        (thread.unreadCountTeacher || 0) > 0 ? "text-white font-medium" : "text-[#7B8798]"
                      )}>
                        {thread.typingIndicator?.student ? (
                          <span className="text-[#5B5CFF]">typing...</span>
                        ) : (
                          thread.lastMessage
                        )}
                      </p>
                      {(thread.unreadCountTeacher || 0) > 0 && (
                        <span className="bg-[#5B5CFF] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0 ml-2">
                          {thread.unreadCountTeacher}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative bg-[#0B1527]">
          {activeThreadId && activeThread ? (
            <>
              {/* Header */}
              <div className="h-16 border-b border-white/[0.06] bg-[#131D2E] flex items-center px-6 shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center">
                    <User className="w-5 h-5 text-[#B6C2D9]" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold leading-tight">{activeThread.studentName}</h2>
                    <div className="text-xs text-[#7B8798] flex items-center gap-1.5 h-4">
                      {activeThread.typingIndicator?.student ? (
                        <span className="text-[#5B5CFF] font-medium animate-pulse">typing...</span>
                      ) : activeThread.onlineStatus?.student ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                          <span className="text-[#B6C2D9]">Online</span>
                        </div>
                      ) : (
                        <span>Offline</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 relative z-0">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-[#7B8798] opacity-50">
                    <p>No messages yet. Send a message to start the conversation.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderRole === "teacher";
                    const showName = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
                    const showTeacherName = isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id} 
                        className={cn("flex flex-col max-w-[75%]", isMe ? "self-end items-end" : "self-start items-start")}
                      >
                        {showTeacherName && <span className="text-[10px] text-[#7B8798] mb-1 mr-1">{msg.senderName} (Teacher)</span>}
                        
                        <div className={cn(
                          "relative px-4 py-2 rounded-2xl break-words whitespace-pre-wrap shadow-sm",
                          isMe 
                            ? "bg-[#5B5CFF] text-white rounded-br-sm" 
                            : "bg-[#131D2E] border border-white/[0.06] text-[#B6C2D9] rounded-bl-sm"
                        )}>
                          {msg.attachmentUrl && (
                            <div className="mb-2 -mx-2 -mt-1 overflow-hidden rounded-xl">
                              {msg.attachmentType === "image" ? (
                                <img src={msg.attachmentUrl} alt="Attachment" className="max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.attachmentUrl, '_blank')} />
                              ) : (
                                <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-black/20 hover:bg-black/40 transition-colors">
                                  <span className="text-sm underline">Download Attachment</span>
                                </a>
                              )}
                            </div>
                          )}
                          <span className="text-[14px] leading-relaxed">{msg.text}</span>
                          
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
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#7B8798]">
              <div className="w-20 h-20 mb-6 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center shadow-inner">
                <Send className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Teacher Chat Support</h3>
              <p className="max-w-xs text-center text-sm leading-relaxed">Select a student from the sidebar to view their messages or reply to their questions.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
