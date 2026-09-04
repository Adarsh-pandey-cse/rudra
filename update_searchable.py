import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_searchable = """    const allSearchable = studentUsers.map(stu => {
      const existingThread = threads.find(t => t.id === stu.id);
      return {
        id: stu.id,
        name: stu.name,
        avatar: stu.avatar,
        thread: existingThread,
      };
    });"""

new_searchable = """    const allSearchable = studentUsers.map(stu => {
      let existingThread = threads.find(t => t.id === stu.id);
      
      // If the teacher cleared this chat AFTER the last message, pretend it's a new chat
      if (existingThread && existingThread.clearedAtTeacher && existingThread.lastMessageTime) {
        if (new Date(existingThread.lastMessageTime).getTime() <= existingThread.clearedAtTeacher) {
          existingThread = undefined;
        }
      }

      return {
        id: stu.id,
        name: stu.name,
        avatar: stu.avatar,
        thread: existingThread,
      };
    });"""

content = content.replace(old_searchable, new_searchable)

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
