"use client";

import { Notice } from "@/types/notice-types";
import { cn } from "@/lib/utils";

interface ImageOnlyNoticeProps {
  notice: Notice;
  badgeVariant: string;
  badgeLabel: string;
  onImageClick: (url: string) => void;
}

export default function ImageOnlyNotice({ notice, badgeVariant, badgeLabel, onImageClick }: ImageOnlyNoticeProps) {
  // Find first image attachment
  const imageAttachment = notice.attachments?.find(a => a.type === 'image');
  const imageUrl = imageAttachment?.url;

  if (!imageUrl) return null;

  const getBadgeColor = (variant: string) => {
    switch (variant) {
      case 'error': return 'bg-[#EF4444] text-white';
      case 'warning': return 'bg-[#F59E0B] text-white';
      case 'info': return 'bg-[#3B82F6] text-white';
      case 'success': return 'bg-[#10B981] text-white';
      default: return 'bg-white/20 text-white backdrop-blur-md';
    }
  };

  return (
    <div 
      className="relative w-full rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] group cursor-pointer transition-transform duration-300 hover:-translate-y-1"
      onClick={() => onImageClick(imageUrl)}
    >
      <div className="aspect-video w-full bg-white/5 relative">
        <img 
          src={imageUrl} 
          alt={notice.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none"></div>
        
        {/* Top Header */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
          <div className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-lg", getBadgeColor(badgeVariant))}>
            {badgeLabel}
          </div>
        </div>
        
        {/* Bottom Meta */}
        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
          <h3 className="text-white font-bold text-xl sm:text-2xl mb-2 line-clamp-1 drop-shadow-md">{notice.title}</h3>
          <div className="flex items-center gap-3 text-white/80 text-xs sm:text-sm font-medium">
            <span>📅 {new Date(notice.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>👤 {notice.teacherName || "Admin"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
