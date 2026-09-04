import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_cond = """      // If the teacher cleared this chat AFTER the last message, pretend it's a new chat
      if (existingThread && existingThread.clearedAtTeacher && existingThread.lastMessageTime) {
        if (new Date(existingThread.lastMessageTime).getTime() <= existingThread.clearedAtTeacher) {
          existingThread = undefined;
        }
      }"""

new_cond = """      // If the teacher cleared this chat AFTER the last message, pretend it's a new chat
      if (existingThread && existingThread.clearedAtTeacher) {
        if (!existingThread.lastMessageTime || new Date(existingThread.lastMessageTime).getTime() <= existingThread.clearedAtTeacher) {
          existingThread = undefined;
        }
      }"""

content = content.replace(old_cond, new_cond)

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
