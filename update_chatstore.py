import re

with open("src/store/chatStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_func = """  setOnlineStatus: async (threadId, role, name, isOnline) => {
    const threadRef = doc(db, "chats", threadId);
    try {
      if (role === "student") {
        await updateDoc(threadRef, { "onlineStatus.student": isOnline });
      } else {
        await updateDoc(threadRef, { "onlineStatus.teacher": isOnline ? name : null });
      }
    } catch(e) {}
  },"""

new_func = """  setOnlineStatus: async (threadId, role, name, isOnline) => {
    const threadRef = doc(db, "chats", threadId);
    try {
      const updates: any = {};
      const timestamp = new Date().toISOString();
      if (role === "student") {
        updates["onlineStatus.student"] = isOnline;
        if (!isOnline) updates["lastSeen.student"] = timestamp;
      } else {
        updates["onlineStatus.teacher"] = isOnline ? name : null;
        if (!isOnline) updates["lastSeen.teacher"] = timestamp;
      }
      await updateDoc(threadRef, updates);
    } catch(e) {}
  },"""

content = content.replace(old_func, new_func)

with open("src/store/chatStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
