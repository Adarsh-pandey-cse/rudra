import re

with open("src/store/chatStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add createThreadIfMissing, deleteMessage, deleteChat to interface
if "deleteMessage:" not in content:
    content = content.replace(
        'setOnlineStatus: (threadId: string, role: "student" | "teacher", name: string, isOnline: boolean) => Promise<void>;',
        'setOnlineStatus: (threadId: string, role: "student" | "teacher", name: string, isOnline: boolean) => Promise<void>;\n  createThreadIfMissing: (studentId: string, studentName: string, studentAvatar?: string) => Promise<void>;\n  deleteMessage: (threadId: string, msgId: string) => Promise<void>;\n  clearChat: (threadId: string) => Promise<void>;'
    )

# 2. Add imports if needed
if "deleteDoc" not in content:
    content = content.replace(
        'collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy, \n  serverTimestamp, getDoc, writeBatch',
        'collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy, \n  serverTimestamp, getDoc, writeBatch, deleteDoc'
    )
    # just in case it's all on one line
    content = content.replace(
        'collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc, writeBatch',
        'collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc, writeBatch, deleteDoc'
    )

# 3. Modify sendMessage batch.update to batch.set(..., {merge:true})
old_batch = """    batch.update(threadRef, updateData);
    await batch.commit();"""

new_batch = """    batch.set(threadRef, updateData, { merge: true });
    await batch.commit();"""
content = content.replace(old_batch, new_batch)

# 4. Append new functions inside create<ChatState>
functions = """  setOnlineStatus: async (threadId, role, name, isOnline) => {
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
"""
if "createThreadIfMissing:" not in content:
    content = re.sub(
        r'setOnlineStatus: async.*?catch\(e\) \{\}\n  \}',
        functions.strip(),
        content,
        flags=re.DOTALL
    )

with open("src/store/chatStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
