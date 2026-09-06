import re

with open("src/types/chat-types.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_onlineStatus = """  onlineStatus: {
    student?: boolean;
    teacher?: string; // Teacher name if online
  };"""

new_onlineStatus = """  onlineStatus: {
    student?: boolean;
    teacher?: string; // Teacher name if online
  };
  lastSeen?: {
    student?: string; // ISO string
    teacher?: string; // ISO string
  };"""

content = content.replace(old_onlineStatus, new_onlineStatus)

with open("src/types/chat-types.ts", "w", encoding="utf-8") as f:
    f.write(content)
