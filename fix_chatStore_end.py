import re

with open("src/store/chatStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace setOnlineStatus to the end
pattern = re.compile(r'  setOnlineStatus: async.*?catch\(e\) \{\}\n  \}\n\}\)\);', re.DOTALL)

replacement = """  setOnlineStatus: async (threadId, role, name, isOnline) => {
    const threadRef = doc(db, "chats", threadId);
    try {
      if (role === "student") {
        await updateDoc(threadRef, { "onlineStatus.student": isOnline });
      } else {
        await updateDoc(threadRef, { "onlineStatus.teacher": isOnline ? name : null });
      }
    } catch(e) {}
  },

  createThreadIfMissing: async (studentId, studentName, studentAvatar) => {
    const threadRef = doc(db, "chats", studentId);
    const snap = await getDoc(threadRef);
    if (!snap.exists()) {
      await setDoc(threadRef, {
        id: studentId,
        studentId,
        studentName,
        studentAvatar: studentAvatar || "",
        lastMessage: "Chat started",
        lastMessageTime: new Date().toISOString(),
        unreadCountTeacher: 0,
        unreadCountStudent: 0,
        typingIndicator: {},
        onlineStatus: {}
      });
    }
  },

  deleteMessage: async (threadId, msgId) => {
    try {
      await deleteDoc(doc(db, `chats/${threadId}/messages`, msgId));
    } catch(e) {
      console.error("Error deleting message", e);
    }
  },

  clearChat: async (threadId) => {
    try {
      // In a real app we'd delete subcollections using a Cloud Function.
      // Here we just delete the thread document and let the UI clear out.
      await deleteDoc(doc(db, "chats", threadId));
      if (get().activeThreadId === threadId) {
        set({ activeThreadId: null, messages: [] });
      }
    } catch (e) {
      console.error("Error clearing chat", e);
    }
  }
}));"""

new_content = pattern.sub(replacement, content)

if new_content == content:
    print("Replace failed")
    
with open("src/store/chatStore.ts", "w", encoding="utf-8") as f:
    f.write(new_content)
