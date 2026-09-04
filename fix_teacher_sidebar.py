import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# I want to update the sidebar list rendering to differentiate active threads vs new students
old_render = """          <div className="flex-1 overflow-y-auto">
            {displayList.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#7B8798]">No students found</div>
            ) : (
              displayList.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleStudentClick(item.id, item.name, item.avatar)}
                  className={cn(
                    "w-full p-4 flex items-center gap-3 text-left transition-colors border-b border-white/[0.02]",
                    activeThreadId === item.id ? "bg-[#5B5CFF]/10" : "hover:bg-white/[0.02]"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 relative">
                    {item.avatar ? (
                      <img src={item.avatar} alt={item.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-[#B6C2D9]" />
                    )}
                    {item.thread?.onlineStatus?.student && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22C55E] border-2 border-[#070D19] rounded-full" />
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-sm font-semibold text-white truncate pr-2">{item.name}</h3>
                      {item.thread && (
                        <span className="text-[10px] text-[#7B8798] shrink-0">
                          {new Date(item.thread.lastMessageTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {item.thread ? (
                      <div className="flex justify-between items-center">
                        <p className={cn(
                          "text-xs truncate", 
                          (item.thread.unreadCountTeacher || 0) > 0 ? "text-white font-medium" : "text-[#7B8798]"
                        )}>
                          {item.thread.typingIndicator?.student ? (
                            <span className="text-[#5B5CFF]">typing...</span>
                          ) : (
                            item.thread.lastMessage
                          )}
                        </p>
                        {(item.thread.unreadCountTeacher || 0) > 0 && (
                          <span className="bg-[#5B5CFF] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0 ml-2">
                            {item.thread.unreadCountTeacher}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[#7B8798] truncate italic">Start a new chat</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>"""

new_render = """          <div className="flex-1 overflow-y-auto">
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
          </div>"""

content = content.replace(old_render, new_render)
with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
