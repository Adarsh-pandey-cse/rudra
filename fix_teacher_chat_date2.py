with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'visibleMessages.map((msg, idx) => {\n                        const isMe = msg.senderRole === "teacher";',
    '''visibleMessages.map((msg, idx) => {
                        const isNewDay = idx === 0 || new Date(msg.timestamp).toLocaleDateString() !== new Date(visibleMessages[idx - 1].timestamp).toLocaleDateString();
                        const msgDateStr = new Date(msg.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                        const isMe = msg.senderRole === "teacher";'''
)

content = content.replace(
    'return (\n                          <motion.div \n                            initial={{ opacity: 0, y: 10 }}\n                            animate={{ opacity: 1, y: 0 }}\n                            key={msg.id} \n                            className={cn("flex flex-col max-w-[75%] group", isMe ? "self-end items-end" : "self-start items-start")}',
    '''return (
                          <React.Fragment key={msg.id}>
                            {isNewDay && (
                              <div className="flex justify-center my-6 w-full relative z-10">
                                <span className="px-4 py-1.5 bg-[#1A2639]/80 backdrop-blur-md text-[#7B8798] text-[11px] font-medium rounded-full border border-white/[0.05] shadow-sm">
                                  {msgDateStr}
                                </span>
                              </div>
                            )}
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn("flex flex-col max-w-[75%] group", isMe ? "self-end items-end" : "self-start items-start")}'''
)

content = content.replace(
    '</motion.div>\n                        );\n                      })\n                    }\n                  </div>',
    '</motion.div>\n                          </React.Fragment>\n                        );\n                      })\n                    }\n                  </div>'
)

if "import React" not in content:
    content = content.replace('import { useState', 'import React, { useState')

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
