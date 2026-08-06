"use client";

import { Kalam } from "next/font/google";
import { autoFormatNoticeText, parseHighlights } from "@/lib/utils/noticeFormatter";
import { Notice } from "@/types/notice-types";
import { CheckCircle, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import GlassButton from "@/components/ui/GlassButton";

const kalam = Kalam({ weight: ["400", "700"], subsets: ["latin"] });

interface BlackboardNoticeProps {
  notice: Notice;
  badgeVariant: string;
  badgeLabel: string;
  isPinned: boolean;
  onExpand?: () => void;
  onAcknowledge?: (e: React.MouseEvent) => void;
  hasAcknowledged?: boolean;
}

export default function BlackboardNotice({
  notice,
  badgeVariant,
  badgeLabel,
  isPinned,
  onExpand,
  onAcknowledge,
  hasAcknowledged
}: BlackboardNoticeProps) {
  
  const formattedBody = autoFormatNoticeText(notice.body);
  const highlightedBody = parseHighlights(formattedBody);

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
        <div className="flex items-start justify-between mb-6">
          <div className={cn("px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border backdrop-blur-sm", getBadgeColor(badgeVariant))}>
            {badgeLabel}
          </div>
          {isPinned && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#FCD34D] uppercase tracking-widest drop-shadow-md">
              <Pin className="w-3.5 h-3.5" />
              Pinned
            </div>
          )}
        </div>

        {/* Content */}
        <div className={cn(kalam.className, "text-center space-y-6 flex-1 flex flex-col items-center justify-center relative z-10")}>
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight max-w-[90%] mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] opacity-95">
            {notice.title}
          </h2>
          
          <div className="text-xl sm:text-2xl text-white/90 leading-relaxed max-w-2xl mx-auto space-y-2 font-medium opacity-85">
            {highlightedBody.split('\n').map((line, i) => (
              <p key={i} className={cn("whitespace-pre-wrap", line.startsWith('✓') && "text-left inline-block w-full sm:w-auto")}>
                {line.split('!!').map((part, j) => 
                  j % 2 === 1 ? <span key={j} className="text-[#FCD34D] font-bold underline decoration-wavy decoration-1 underline-offset-4">{part}</span> : part
                )}
              </p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-end justify-between border-t border-white/10 pt-4 relative z-10">
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
        
        {/* Bottom Chalk Pieces */}
        <div className="absolute bottom-2 left-10 flex gap-2 opacity-80 pointer-events-none">
          <div className="w-8 h-2.5 bg-white rounded-sm rotate-2 shadow-sm"></div>
          <div className="w-4 h-2.5 bg-[#F472B6] rounded-sm -rotate-3 shadow-sm"></div>
          <div className="w-6 h-2.5 bg-[#34D399] rounded-sm rotate-1 shadow-sm"></div>
        </div>
      </div>
    </div>
  );
}
