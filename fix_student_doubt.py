import re

with open('src/app/dashboard/student/doubts/[id]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add student avatar (isMe)
old_message_content = '''                        {/* Timestamp */}
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                          <span className="text-[9px] text-[#7B8798]/70">{formatMessageTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    </div>'''

new_message_content = '''                        {/* Timestamp */}
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                          <span className="text-[9px] text-[#7B8798]/70">{formatMessageTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {isMe && (
                      <div className="w-7 h-7 rounded-full shrink-0 ml-2 mt-1 shadow-md overflow-hidden">
                        <img src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id}`} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                    )}'''

content = content.replace(old_message_content, new_message_content)

# Use dicebear instead of just "T" fallback for teachers if no real avatar
content = content.replace(
    'return <span className="text-[11px] font-bold text-white">{msg.authorName?.[0]?.toUpperCase() || "T"}</span>;',
    'return <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.authorId}`} alt="Avatar" className="w-full h-full object-cover" />;'
)

with open('src/app/dashboard/student/doubts/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
