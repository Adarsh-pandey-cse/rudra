import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace everything from `{messages.length === 0 ? (` down to `<div ref={messagesEndRef} />`
# Using regex to grab the block.
start_str = '{messages.length === 0 ? ('
end_str = '<div ref={messagesEndRef} />'

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_block = """{(() => {
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
                <div ref={messagesEndRef} />"""
    
    content = content[:start_idx] + new_block + content[end_idx + len(end_str):]

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
