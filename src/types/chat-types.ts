export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: "student" | "teacher" | "system";
  senderName: string;
  senderAvatar?: string;
  text: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "document" | "video";
  status: "sent" | "delivered" | "read";
  createdAt: string;
}

export interface ChatThread {
  id: string; // The studentId
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCountTeacher: number;
  unreadCountStudent: number;
  typingIndicator: {
    student?: boolean;
    teacher?: string; // Teacher name if typing
  };
  onlineStatus: {
    student?: boolean;
    teacher?: string; // Teacher name if online
  };
}
