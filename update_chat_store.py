import re

with open("src/store/chatStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Update signature
content = content.replace(
    'clearChat: (threadId: string) => Promise<void>;',
    'clearChat: (threadId: string, role: "teacher" | "student", clearType: "me" | "everyone") => Promise<void>;'
)

# Update implementation
old_clear = """  clearChat: async (threadId) => {
    try {
      // Step 1: Delete all messages in the subcollection first!
      const messagesRef = collection(db, `chats/${threadId}/messages`);
      const msgSnapshot = await getDocs(messagesRef);
      
      const batch = writeBatch(db);
      msgSnapshot.docs.forEach((msgDoc) => {
        batch.delete(msgDoc.ref);
      });
      await batch.commit();

      // Step 2: Delete the thread document itself
      await deleteDoc(doc(db, "chats", threadId));
      
      // Step 3: Clear UI state
      if (get().activeThreadId === threadId) {
        set({ activeThreadId: null, messages: [] });
      }
    } catch (e) {
      console.error("Error clearing chat", e);
    }
  }"""

new_clear = """  clearChat: async (threadId, role, clearType) => {
    try {
      if (clearType === "everyone") {
        // Step 1: Delete all messages in the subcollection
        const messagesRef = collection(db, `chats/${threadId}/messages`);
        const msgSnapshot = await getDocs(messagesRef);
        
        const batch = writeBatch(db);
        msgSnapshot.docs.forEach((msgDoc) => {
          batch.delete(msgDoc.ref);
        });
        await batch.commit();
  
        // Step 2: Delete the thread document itself
        await deleteDoc(doc(db, "chats", threadId));
        
        if (get().activeThreadId === threadId) {
          set({ activeThreadId: null, messages: [] });
        }
      } else {
        // Clear for ME only: Update the clearedAt timestamp
        const threadRef = doc(db, "chats", threadId);
        const updateData: any = {};
        if (role === "teacher") updateData.clearedAtTeacher = Date.now();
        if (role === "student") updateData.clearedAtStudent = Date.now();
        
        await updateDoc(threadRef, updateData);
        
        // Don't close the chat, just let the listener filter out old messages
      }
    } catch (e) {
      console.error("Error clearing chat", e);
    }
  }"""

content = content.replace(old_clear, new_clear)

with open("src/store/chatStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
