import re

with open('src/app/dashboard/teacher/doubts/[id]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add users to useAuthStore
content = content.replace(
    'const { currentUser } = useAuthStore();',
    'const { currentUser, users } = useAuthStore();'
)

# Replace student avatar logic
old_student_avatar = '''                    {/* Student avatar */}
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5B5CFF] to-[#8B5CF6] flex items-center justify-center shrink-0 mr-2 mt-1 shadow-md text-white font-bold text-xs">
                        {doubt.studentName.charAt(0)}
                      </div>
                    )}'''

new_student_avatar = '''                    {/* Student avatar */}
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full shrink-0 mr-2 mt-1 shadow-md overflow-hidden">
                        <img src={users.find(u => u.id === doubt.studentId)?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doubt.studentId}`} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                    )}'''
content = content.replace(old_student_avatar, new_student_avatar)

# Add teacher avatar
old_message_content = '''                        {msg.timestamp && (
                          <span className={`text-[9px] mt-1 block w-full text-right ${isMe ? "text-white/60" : "text-[#7B8798]"}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>'''

new_message_content = '''                        {msg.timestamp && (
                          <span className={`text-[9px] mt-1 block w-full text-right ${isMe ? "text-white/60" : "text-[#7B8798]"}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
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
