import { create } from "zustand";
import { db } from "@/lib/firebase/firebase";
import { 
  collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy, 
  serverTimestamp, getDoc, writeBatch 
} from "firebase/firestore";
import type { ChatThread, ChatMessage } from "@/types/chat-types";
import { uploadFile } from "@/lib/firebase/uploadService";

interface ChatState {
  threads: ChatThread[];
  activeThreadId: string | null;
  messages: ChatMessage[];
  unreadTotal: number;
  
  setActiveThreadId: (id: string | null) => void;
  
  // Listeners
  initializeTeacherThreadsListener: () => () => void;
  initializeStudentThreadListener: (studentId: string, studentName: string) => () => void;
  initializeMessagesListener: (threadId: string, currentUserRole: string) => () => void;
  
  // Actions
  sendMessage: (threadId: string, text: string, sender: any, attachmentFile?: File | null) => Promise<void>;
  markAsRead: (threadId: string, role: "student" | "teacher") => Promise<void>;
  setTypingStatus: (threadId: string, role: "student" | "teacher", name: string, isTyping: boolean) => Promise<void>;
  setOnlineStatus: (threadId: string, role: "student" | "teacher", name: string, isOnline: boolean) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  threads: [],
  activeThreadId: null,
  messages: [],
  unreadTotal: 0,
  
  setActiveThreadId: (id) => set({ activeThreadId: id }),

  initializeTeacherThreadsListener: () => {
    const q = query(collection(db, "chats"), orderBy("lastMessageTime", "desc"));
    return onSnapshot(q, (snapshot) => {
      const threads = snapshot.docs.map(doc => doc.data() as ChatThread);
      const unreadTotal = threads.reduce((sum, t) => sum + (t.unreadCountTeacher || 0), 0);
      set({ threads, unreadTotal });
    });
  },

  initializeStudentThreadListener: (studentId, studentName) => {
    const threadRef = doc(db, "chats", studentId);
    return onSnapshot(threadRef, (snapshot) => {
      if (snapshot.exists()) {
        const thread = snapshot.data() as ChatThread;
        set({ threads: [thread], unreadTotal: thread.unreadCountStudent || 0 });
      } else {
        // Create initial thread if it doesn't exist
        setDoc(threadRef, {
          id: studentId,
          studentId,
          studentName,
          lastMessage: "Start of conversation",
          lastMessageTime: new Date().toISOString(),
          unreadCountTeacher: 0,
          unreadCountStudent: 0,
          typingIndicator: {},
          onlineStatus: {}
        });
      }
    });
  },

  initializeMessagesListener: (threadId, currentUserRole) => {
    const q = query(
      collection(db, `chats/${threadId}/messages`), 
      orderBy("createdAt", "asc")
    );
    
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data() as ChatMessage);
      set({ messages: msgs });
      
      // Auto-mark as read if we are receiving new messages in the active thread
      const store = get();
      if (store.activeThreadId === threadId) {
        const hasUnread = msgs.some(m => m.senderRole !== currentUserRole && m.status !== "read");
        if (hasUnread) {
          store.markAsRead(threadId, currentUserRole as "student" | "teacher");
        }
      }
    });
  },

  sendMessage: async (threadId, text, sender, attachmentFile) => {
    const msgId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    
    let attachmentUrl = "";
    let attachmentType = "";
    
    if (attachmentFile) {
      attachmentUrl = await uploadFile(attachmentFile, `chats/${threadId}/${msgId}`);
      attachmentType = attachmentFile.type.startsWith("image/") ? "image" : "document";
    }

    const newMessage: ChatMessage = {
      id: msgId,
      senderId: sender.id,
      senderRole: sender.role,
      senderName: sender.name,
      senderAvatar: sender.avatar,
      text,
      attachmentUrl,
      attachmentType: attachmentType as any,
      status: "sent",
      createdAt: now
    };

    const threadRef = doc(db, "chats", threadId);
    const msgRef = doc(db, `chats/${threadId}/messages`, msgId);

    const batch = writeBatch(db);
    batch.set(msgRef, newMessage);

    // Prepare thread update
    const isTeacher = sender.role === "teacher";
    const updateData: any = {
      lastMessage: attachmentType === "image" ? "📷 Image" : text,
      lastMessageTime: now,
    };
    
    // Increment unread count for the recipient
    if (isTeacher) {
      updateData.unreadCountStudent = (get().threads.find(t => t.id === threadId)?.unreadCountStudent || 0) + 1;
      updateData["typingIndicator.teacher"] = null; // Clear typing when sending
    } else {
      updateData.unreadCountTeacher = (get().threads.find(t => t.id === threadId)?.unreadCountTeacher || 0) + 1;
      updateData["typingIndicator.student"] = false;
    }

    batch.update(threadRef, updateData);
    await batch.commit();
  },

  markAsRead: async (threadId, role) => {
    const threadRef = doc(db, "chats", threadId);
    const msgsRef = collection(db, `chats/${threadId}/messages`);
    
    const unreadField = role === "teacher" ? "unreadCountTeacher" : "unreadCountStudent";
    
    try {
      // 1. Reset unread count on thread
      await updateDoc(threadRef, {
        [unreadField]: 0
      });
      
      // 2. We can't batch update an entire collection easily in client-side Firebase without fetching first, 
      // but we already have them in state. Let's find unread ones from the other person.
      const msgs = get().messages;
      const otherRole = role === "teacher" ? "student" : "teacher";
      const unreadMsgs = msgs.filter(m => m.senderRole === otherRole && m.status !== "read");
      
      if (unreadMsgs.length > 0) {
        const batch = writeBatch(db);
        unreadMsgs.forEach(m => {
          batch.update(doc(db, `chats/${threadId}/messages`, m.id), { status: "read" });
        });
        await batch.commit();
      }
    } catch (e) {
      console.error("Error marking as read", e);
    }
  },

  setTypingStatus: async (threadId, role, name, isTyping) => {
    const threadRef = doc(db, "chats", threadId);
    try {
      if (role === "student") {
        await updateDoc(threadRef, { "typingIndicator.student": isTyping });
      } else {
        await updateDoc(threadRef, { "typingIndicator.teacher": isTyping ? name : null });
      }
    } catch(e) {}
  },

  setOnlineStatus: async (threadId, role, name, isOnline) => {
    const threadRef = doc(db, "chats", threadId);
    try {
      if (role === "student") {
        await updateDoc(threadRef, { "onlineStatus.student": isOnline });
      } else {
        await updateDoc(threadRef, { "onlineStatus.teacher": isOnline ? name : null });
      }
    } catch(e) {}
  }
}));
