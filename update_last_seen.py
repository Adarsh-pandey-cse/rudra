import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

helper_old = """const formatLastSeen = (timestamp?: string) => {
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
};"""

helper_new = """const formatLastSeen = (timestamp?: string, fallbackTimestamp?: string) => {
  const ts = timestamp || fallbackTimestamp;
  if (!ts) return "Offline";
  const date = new Date(ts);
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  if (isToday) {
    return `Last seen today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.getDate() === date.getDate() && yesterday.getMonth() === date.getMonth() && yesterday.getFullYear() === date.getFullYear();
  if (isYesterday) {
    return `Last seen yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  return `Last seen ${date.toLocaleDateString([], { day: '2-digit', month: 'short' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};"""

content = content.replace(helper_old, helper_new)

ui_old = """                        ) : (
                          <span>{formatLastSeen(activeThread?.lastSeen?.student)}</span>
                        )}"""

ui_new = """                        ) : (
                          <span>{formatLastSeen(activeThread?.lastSeen?.student, activeThread?.lastMessageTime)}</span>
                        )}"""

content = content.replace(ui_old, ui_new)

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
