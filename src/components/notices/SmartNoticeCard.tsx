"use client";

import { useState } from "react";
import { Notice } from "@/types/notice-types";
import BlackboardNotice from "./BlackboardNotice";
import CombinedNotice from "./CombinedNotice";
import FullScreenViewer from "./FullScreenViewer";
import { useAuthStore } from "@/store/authStore";

interface SmartNoticeCardProps {
  notice: Notice;
  isPinned?: boolean;
  onAcknowledge?: (id: string, e: React.MouseEvent) => void;
  hasAcknowledged?: boolean;
  requiresAck?: boolean;
}

export default function SmartNoticeCard({
  notice,
  isPinned = false,
  onAcknowledge,
  hasAcknowledged,
  requiresAck
}: SmartNoticeCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState("");
  const { users } = useAuthStore();

  const authorUser = users.find(u => u.id === notice.teacherId);
  const authorAvatar = authorUser?.avatar || null;
  const authorName = authorUser?.name || notice.teacherName || "Admin";

  const handleImageClick = (url: string) => {
    setViewerImage(url);
    setViewerOpen(true);
  };

  const getPriorityBadgeVariant = (priority: string) => {
    if (priority === "critical") return "error";    
    if (priority === "high") return "warning";      
    return "info";                                  
  };
  
  const getPriorityLabel = (priority: string) => {
    if (priority === "critical") return "IMPORTANT";
    if (priority === "high") return "LOW IMPORTANT";
    return "INFORMATION";
  };

  const badgeVariant = getPriorityBadgeVariant(notice.priority);
  const badgeLabel = getPriorityLabel(notice.priority);

  const hasBody = notice.body && notice.body.trim().length > 0;
  const hasImage = notice.attachments && notice.attachments.some(a => a.type === 'image');

  const handleAcknowledge = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAcknowledge) {
      onAcknowledge(notice.id, e);
    }
  };

  return (
    <>
      <CombinedNotice 
        notice={notice} 
        badgeVariant={badgeVariant} 
        badgeLabel={badgeLabel} 
        isPinned={isPinned}
        onImageClick={handleImageClick}
        onAcknowledge={requiresAck ? handleAcknowledge : undefined}
        hasAcknowledged={hasAcknowledged}
        authorAvatar={authorAvatar}
        authorName={authorName}
      />
      <FullScreenViewer 
        isOpen={viewerOpen} 
        onClose={() => setViewerOpen(false)} 
        imageUrl={viewerImage}
        title={notice.title}
        date={new Date(notice.createdAt).toLocaleDateString()}
        author={authorName}
        authorAvatar={authorAvatar}
      />
    </>
  );
}
