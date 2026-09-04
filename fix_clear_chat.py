import re

with open("src/store/chatStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# I will update clearChat to actually delete all messages from the subcollection.
old_clear = """  clearChat: async (threadId) => {
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
  }"""

new_clear = """  clearChat: async (threadId) => {
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

content = content.replace(old_clear, new_clear)

# I need to make sure `getDocs` and `writeBatch` are imported.
# It seems writeBatch is imported because sendMessage uses it. Let's check getDocs.
if "getDocs," not in content and "getDocs " not in content:
    content = content.replace("getDoc,", "getDoc, getDocs,")

with open("src/store/chatStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
