"use client";

import { autoFormatNoticeText, parseHighlights } from "@/lib/utils/noticeFormatter";
import { Notice } from "@/types/notice-types";
import { CheckCircle, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import GlassButton from "@/components/ui/GlassButton";


interface CombinedNoticeProps {
  notice: Notice;
  badgeVariant: string;
  badgeLabel: string;
  isPinned: boolean;
  onExpand?: () => void;
  onImageClick: (url: string) => void;
  onAcknowledge?: (e: React.MouseEvent) => void;
  hasAcknowledged?: boolean;
  authorAvatar?: string | null;
  authorName?: string;
}

export default function CombinedNotice({
  notice,
  badgeVariant,
  badgeLabel,
  isPinned,
  onExpand,
  onImageClick,
  onAcknowledge,
  hasAcknowledged,
  authorAvatar,
  authorName
}: CombinedNoticeProps) {
  
  const formattedBody = autoFormatNoticeText(notice.body);
  const highlightedBody = parseHighlights(formattedBody);
  
  const imageAttachment = notice.attachments?.find(a => a.type === 'image');
  const imageUrl = imageAttachment?.url;

  const getBadgeColor = (variant: string) => {
    switch (variant) {
      case 'error': return 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30';
      case 'warning': return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30';
      case 'info': return 'bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30';
      case 'success': return 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  return (
    <div 
      className={cn(
        "relative rounded-[16px] overflow-hidden p-2 transition-transform duration-300 hover:scale-[1.01] cursor-pointer shadow-2xl",
        "bg-gradient-to-br from-[#8B5A2B] to-[#5C3A21]" // Wood frame base
      )}
      onClick={onExpand}
    >
      {/* Wood Frame Texture Layer */}
      <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none mix-blend-overlay"></div>
      
      {/* Inner Blackboard */}
      <div className={cn(
        "relative bg-[#1a3c2a] rounded-[10px] p-6 sm:p-8 min-h-[250px] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col justify-between",
        "bg-[url('https://www.transparenttextures.com/patterns/chalkboard.png')]"
      )}>
        
        {/* Push Pin */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 drop-shadow-md">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FCD34D] to-[#B45309] border border-[#F59E0B] shadow-[0_4px_10px_rgba(0,0,0,0.4)] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white/40"></div>
          </div>
          <div className="w-1 h-3 bg-gray-400 mx-auto -mt-1 -z-10 shadow-sm"></div>
        </div>

        {/* Top Header */}
        <div className="flex items-start justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            {authorAvatar ? (
              authorAvatar.length < 10 ? (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-xs border border-white/20">
                  {authorAvatar}
                </div>
              ) : (
                <img src={authorAvatar} alt={authorName} className="w-8 h-8 rounded-full object-cover border border-white/20" />
              )
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-xs border border-white/20">
                {authorName?.substring(0, 2).toUpperCase() || "AD"}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-white/90 text-[11px] font-bold tracking-wider uppercase">{authorName}</span>
              <div className={cn("px-2 py-0.5 mt-1 w-max rounded text-[10px] font-bold tracking-wider uppercase border backdrop-blur-sm", getBadgeColor(badgeVariant))}>
                {badgeLabel}
              </div>
            </div>
          </div>
          {isPinned && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#FCD34D] uppercase tracking-widest drop-shadow-md">
              <Pin className="w-3.5 h-3.5" />
              Pinned
            </div>
          )}
        </div>

        {/* Content (Text First) */}
        <div className={cn("text-left space-y-6 flex-1 flex flex-col items-start justify-start relative z-10 mb-8")}>
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] opacity-95 w-full">
            {notice.title}
          </h2>
          
          <div className="text-base sm:text-lg text-white/90 leading-relaxed w-full space-y-2 font-medium opacity-90">
            {highlightedBody.split('\n').map((line, i) => (
              <p key={i} className="whitespace-pre-wrap text-left w-full break-words">
                {line.split('!!').map((part, j) => 
                  j % 2 === 1 ? <span key={j} className="text-[#FCD34D] font-bold underline decoration-wavy decoration-1 underline-offset-4">{part}</span> : part
                )}
              </p>
            ))}
          </div>
        </div>
        
        {/* Attached Image */}
        {imageUrl && (
          <div className="w-full relative z-10 mb-8 group">
            {/* Paper clip effect */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-12 border-2 border-white/40 rounded-full bg-transparent z-20 shadow-md transform rotate-[15deg]"></div>
            
            <div 
              className="w-full sm:max-w-md mx-auto aspect-[4/3] rounded-[16px] overflow-hidden border-[6px] border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.3)] bg-black/20"
              onClick={(e) => {
                e.stopPropagation();
                onImageClick(imageUrl);
              }}
            >
              <img 
                src={imageUrl} 
                alt={notice.title} 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-end justify-between border-t border-white/10 pt-4 relative z-10">
          <div className="text-white/60 font-medium text-sm space-y-1">
            <p>📅 {new Date(notice.createdAt).toLocaleDateString()}</p>
            <p>🕒 {new Date(notice.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Published By</p>
            <p className="text-white font-medium flex items-center gap-1.5 justify-end">
              {notice.teacherName || "Admin"}
              <CheckCircle className="w-3.5 h-3.5 text-[#34D399]" />
            </p>
          </div>
        </div>
        
        {/* Acknowledge Button */}
        {onAcknowledge && (
           <div className="mt-6 flex justify-center">
             <GlassButton 
               onClick={onAcknowledge}
               disabled={hasAcknowledged}
               className={cn(
                 "font-bold uppercase tracking-wider text-xs",
                 hasAcknowledged ? "bg-white/10 text-white/50 border-white/10" : "bg-white text-black hover:bg-gray-200"
               )}
             >
               {hasAcknowledged ? "Acknowledged" : "Acknowledge Notice"}
             </GlassButton>
           </div>
        )}
      </div>
    </div>
  );
}

