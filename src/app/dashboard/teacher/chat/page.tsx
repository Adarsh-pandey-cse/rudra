"use client";
import Link from "next/link";
﻿

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Send, Image as ImageIcon, Check, CheckCheck, Loader2, X, Search, User, ArrowLeft, Trash2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function TeacherChatPage() {
  const { currentUser, users, getAllUsers } = useAuthStore();
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
    setActiveThreadId,
    createThreadIfMissing,
    deleteMessage,
    clearChat
  } = useChatStore();

  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [search, setSearch] = useState("");
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    getAllUsers();
  }, [getAllUsers]);


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubMessagesRef = useRef<(() => void) | null>(null);
  
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

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
    } catch(err) {
      console.error(err);
      alert("Failed to send message. Make sure Firestore rules allow writes to chats.");
    } finally {
      setIsSending(false);
    }
  };

  const handleStudentClick = async (studentId: string, studentName: string, studentAvatar?: string) => {
    try {
      await createThreadIfMissing(studentId, studentName, studentAvatar);
    } catch (e) {
      console.error("Could not create thread upfront (might be rules), continuing anyway:", e);
    }
    setActiveThreadId(studentId);
    setSearch("");
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (activeThreadId && window.confirm("Delete this message?")) {
      await deleteMessage(activeThreadId, msgId);
    }
  };

  const handleClearChat = async (type: "me" | "everyone") => {
    if (activeThreadId) {
      await clearChat(activeThreadId, "teacher", type);
      setShowClearDialog(false);
    }
  };

  if (!currentUser) return null;

  // Global search list combining existing threads and other students
  const studentUsers = users.filter(u => u.role === "student" && u.name.toLowerCase().includes(search.toLowerCase()));
  const allSearchable = studentUsers.map(stu => {
    const existingThread = threads.find(t => t.id === stu.id);
    return {
      id: stu.id,
      name: stu.name,
      avatar: stu.avatar,
      thread: existingThread,
    };
  });
  
  // Sort: threads with messages first, then unmessaged students
  allSearchable.sort((a, b) => {
    if (a.thread && !b.thread) return -1;
    if (!a.thread && b.thread) return 1;
    if (a.thread && b.thread) return new Date(b.thread.lastMessageTime).getTime() - new Date(a.thread.lastMessageTime).getTime();
    return a.name.localeCompare(b.name);
  });
  
  // If no search, just show existing threads
  const displayList = search ? allSearchable : threads.map(t => ({ id: t.id, name: t.studentName, avatar: t.studentAvatar, thread: t }));

  return (
    <DashboardLayout role="teacher">
      <div className="absolute inset-0 mb-[104px] md:inset-6 md:mb-6 lg:inset-8 lg:mb-8 max-w-6xl mx-auto flex bg-[#0B1527] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl z-0">
        
        {/* Sidebar */}
        <div className={cn("w-full md:w-80 shrink-0 border-r border-white/[0.06] flex-col bg-[#070D19]", activeThreadId ? "hidden md:flex" : "flex")}>
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 mb-4">
                <Link href="/dashboard/teacher" className="md:hidden p-2 -ml-2 hover:bg-white/[0.1] rounded-full text-[#B6C2D9] transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h2 className="text-lg font-bold text-white">Student Chats</h2>
              </div>
            <div className="relative">
              <Search className="w-4 h-4 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search any student..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.06] text-sm text-white rounded-xl pl-9 pr-4 py-2 outline-none focus:border-[#5B5CFF]/50 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {displayList.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#7B8798]">No students found</div>
            ) : (
              <div className="flex flex-col">
                {displayList.map((item, idx) => {
                  const isFirstNew = !item.thread && (idx === 0 || displayList[idx-1].thread);
                  return (
                    <div key={item.id}>
                      {isFirstNew && (
                        <div className="px-4 py-2 mt-2 text-xs font-bold text-[#7B8798] uppercase tracking-wider bg-white/[0.02]">
                          Start a new chat
                        </div>
                      )}
                      <button
                        onClick={() => handleStudentClick(item.id, item.name, item.avatar)}
                        className={cn(
                          "w-full p-4 flex items-center gap-3 text-left transition-colors border-b border-white/[0.02]",
                          activeThreadId === item.id ? "bg-[#5B5CFF]/10" : "hover:bg-white/[0.02]"
                        )}
                      >
                        <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 relative">
                          {item.avatar ? (
                            <img src={item.avatar} alt={item.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-[#B6C2D9]" />
                          )}
                          {item.thread?.onlineStatus?.student && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#22C55E] border-2 border-[#070D19] rounded-full" />
                          )}
                        </div>
                        
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h3 className="text-[15px] font-semibold text-white truncate pr-2">{item.name}</h3>
                            {item.thread && (
                              <span className="text-[11px] text-[#7B8798] shrink-0">
                                {new Date(item.thread.lastMessageTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                          {item.thread ? (
                            <div className="flex justify-between items-center">
                              <p className={cn(
                                "text-[13px] truncate", 
                                (item.thread.unreadCountTeacher || 0) > 0 ? "text-white font-medium" : "text-[#7B8798]"
                              )}>
                                {item.thread.typingIndicator?.student ? (
                                  <span className="text-[#5B5CFF]">typing...</span>
                                ) : (
                                  item.thread.lastMessage
                                )}
                              </p>
                              {(item.thread.unreadCountTeacher || 0) > 0 && (
                                <span className="bg-[#22C55E] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shrink-0 ml-2">
                                  {item.thread.unreadCountTeacher}
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-[13px] text-[#5B5CFF] truncate italic">Tap to message</p>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative bg-[#0B1527]">
          {activeThreadId ? (
            <>
              {/* Header */}
              <div className="h-16 border-b border-white/[0.06] bg-[#131D2E] flex items-center justify-between px-6 shrink-0 relative z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveThreadId(null)}
                    className="md:hidden p-2 -ml-2 hover:bg-white/[0.1] rounded-full text-[#B6C2D9] transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden">
                    {displayList.find(s => s.id === activeThreadId)?.avatar ? (
                      <img src={displayList.find(s => s.id === activeThreadId)?.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-[#B6C2D9]" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-white font-semibold leading-tight">{displayList.find(s => s.id === activeThreadId)?.name || "Student"}</h2>
                    <div className="text-xs text-[#7B8798] flex items-center gap-1.5 h-4">
                      {activeThread?.typingIndicator?.student ? (
                        <span className="text-[#5B5CFF] font-medium animate-pulse">typing...</span>
                      ) : activeThread?.onlineStatus?.student ? (
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
                
                {/* Delete Chat Button */}
                <button 
                  onClick={() => setShowClearDialog(true)}
                  title="Clear Chat History"
                  className="w-10 h-10 rounded-full bg-white/[0.02] hover:bg-[#EF4444]/10 text-[#7B8798] hover:text-[#EF4444] flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 z-0">
                {(() => {
                  const activeThread = threads.find(t => t.id === activeThreadId);
                  const visibleMessages = messages.filter(msg => {
                    if (!activeThread?.clearedAtTeacher) return true;
                    return new Date(msg.createdAt).getTime() > activeThread.clearedAtTeacher;
                  });
                  return visibleMessages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#7B8798] opacity-50">
                      <p>No messages yet. Send a message to start the conversation.</p>
                    </div>
                  ) : (
                    visibleMessages.map((msg, idx) => {
                      const isMe = msg.senderRole === "teacher";
                      const showTeacherName = isMe && (idx === 0 || visibleMessages[idx - 1].senderId !== msg.senderId);

                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={msg.id} 
                          className={cn("flex flex-col max-w-[75%] group", isMe ? "self-end items-end" : "self-start items-start")}
                        >
                          {showTeacherName && <span className="text-[10px] text-[#7B8798] mb-1 mr-1">{msg.senderName} (Teacher)</span>}
                          
                          <div className="flex items-center gap-2 relative w-full justify-end">
                            {/* Action Buttons */}
                            <div className={cn(
                              "opacity-0 group-hover:opacity-100 flex flex-col gap-1 transition-all",
                              isMe ? "order-1" : "order-2"
                            )}>
                              {msg.attachmentUrl && (
                                <a 
                                  href={msg.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="p-1.5 rounded-full hover:bg-white/[0.06] text-[#7B8798] hover:text-[#38BDF8] transition-all"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button 
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1.5 rounded-full hover:bg-white/[0.06] text-[#7B8798] hover:text-[#EF4444] transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Message Bubble */}
                            <div className={cn(
                              "p-3 rounded-2xl relative shadow-sm",
                              isMe 
                                ? "bg-[#5B5CFF] text-white rounded-tr-sm order-2" 
                                : "bg-white/[0.06] text-[#E2E8F0] rounded-tl-sm order-1"
                            )}>
                              {msg.attachmentUrl && (
                                <div className="mb-2 -mx-2 -mt-1 overflow-hidden rounded-xl">
                                  {msg.attachmentType === "image" ? (
                                    <div className="relative group/img">
                                      <img 
                                        src={msg.attachmentUrl} 
                                        alt="Attachment" 
                                        className="max-w-full max-h-[300px] object-contain rounded-lg bg-black/20 cursor-zoom-in hover:opacity-90 transition-opacity" 
                                        onClick={() => setFullScreenImage(msg.attachmentUrl!)} 
                                      />
                                    </div>
                                  ) : (
                                    <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
                                      <div className="w-8 h-8 rounded-full bg-[#5B5CFF]/20 flex items-center justify-center">
                                        <Download className="w-4 h-4 text-[#5B5CFF]" />
                                      </div>
                                      <span className="text-sm font-medium">Download Document</span>
                                    </a>
                                  )}
                                </div>
                              )}
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              <div className={cn("flex items-center gap-1 mt-1.5", isMe ? "justify-end text-white/70" : "justify-start text-[#7B8798]")}>
                                <span className="text-[10px] uppercase tracking-wider">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
                  );
                })()}
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
              <p className="max-w-xs text-center text-sm leading-relaxed">Search and select a student from the sidebar to view their messages or reply to their questions.</p>
            </div>
          )}
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
      {/* Clear Chat Dialog */}
      <AnimatePresence>
        {showClearDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#07111F]/80 backdrop-blur-sm"
              onClick={() => setShowClearDialog(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#0B1527] border border-white/[0.06] rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
            >
              <h3 className="text-xl font-bold text-white text-center">Clear Chat</h3>
              <p className="text-[#7B8798] text-sm text-center mb-2">How would you like to clear this conversation?</p>
              
              <button 
                onClick={() => handleClearChat("me")}
                className="w-full py-3 px-4 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-xl font-medium transition-colors"
              >
                Clear for Me
              </button>
              <button 
                onClick={() => handleClearChat("everyone")}
                className="w-full py-3 px-4 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] rounded-xl font-medium transition-colors"
              >
                Clear for Everyone
              </button>
              <button 
                onClick={() => setShowClearDialog(false)}
                className="w-full py-3 px-4 text-[#7B8798] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}