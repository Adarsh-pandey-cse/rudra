import re

with open('src/app/dashboard/teacher/doubts/[id]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add teacher avatar
old_message_content = '''                        <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                          <span className="text-[9px] text-[#7B8798]/70">{formatMessageTime(msg.createdAt)}</span>
                          {isMe && <CheckCircle2 className="w-2.5 h-2.5 text-[#4F9DFF]/50" />}
                        </div>
                      </div>
                    </div>'''

new_message_content = '''                        <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                          <span className="text-[9px] text-[#7B8798]/70">{formatMessageTime(msg.createdAt)}</span>
                          {isMe && <CheckCircle2 className="w-2.5 h-2.5 text-[#4F9DFF]/50" />}
                        </div>
                      </div>
                    </div>
                    {isMe && (
                      <div className="w-7 h-7 rounded-full shrink-0 ml-2 mt-1 shadow-md overflow-hidden">
                        <img src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id}`} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                    )}'''

content = content.replace(old_message_content, new_message_content)

with open('src/app/dashboard/teacher/doubts/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
