import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

helper = """
const formatLastSeen = (timestamp?: string) => {
  if (!timestamp) return "Offline";
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  if (isToday) {
    return `Last seen today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).getDate() === date.getDate() && now.getMonth() === date.getMonth();
  if (isYesterday) {
    return `Last seen yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `Last seen ${date.toLocaleDateString([], { day: '2-digit', month: 'short' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export default function TeacherChatPage() {"""

content = content.replace("export default function TeacherChatPage() {", helper)

old_ui = """                        ) : activeThread?.onlineStatus?.student ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                            <span className="text-[#B6C2D9]">Online</span>
                          </div>
                        ) : (
                          <span>Offline</span>
                        )}"""

new_ui = """                        ) : activeThread?.onlineStatus?.student ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                            <span className="text-[#B6C2D9]">Online</span>
                          </div>
                        ) : (
                          <span>{formatLastSeen(activeThread?.lastSeen?.student)}</span>
                        )}"""

content = content.replace(old_ui, new_ui)

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
