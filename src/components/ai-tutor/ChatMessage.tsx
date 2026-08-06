import React from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import GlassCard from "@/components/ui/GlassCard";

export type MessageSender = "ai" | "student";

export interface ChatMessageProps {
  id: string;
  content: React.ReactNode;
  sender: MessageSender;
  timestamp: string;
  isStreaming?: boolean;
}

export default function ChatMessage({ content, sender, timestamp, isStreaming }: ChatMessageProps) {
  const isAi = sender === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn("flex w-full", isAi ? "justify-start" : "justify-end")}
    >
      <div className={cn("flex max-w-[85%] sm:max-w-[75%] gap-4", isAi ? "flex-row" : "flex-row-reverse")}>
        
        {/* Avatar */}
        <div className="flex-shrink-0 mt-1">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center border",
            isAi 
              ? "bg-purple-500/20 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
              : "bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          )}>
            {isAi ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
        </div>

        {/* Message Bubble */}
        <div className={cn("flex flex-col gap-1", isAi ? "items-start" : "items-end")}>
          <div className="flex items-center gap-2 px-1">
            <span className="text-sm font-medium text-white/70">{isAi ? "Rudra AI" : "You"}</span>
            <span className="text-xs text-white/40">{timestamp}</span>
          </div>
          
          <GlassCard className={cn(
            "px-5 py-4", 
            isAi ? "border-purple-500/30 bg-purple-500/5 rounded-tl-sm" : "border-blue-500/30 bg-blue-500/5 rounded-tr-sm"
          )}>
            <div className="text-white/90 leading-relaxed space-y-4">
              {content}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-purple-400 animate-pulse rounded-sm" />
              )}
            </div>
          </GlassCard>
        </div>

      </div>
    </motion.div>
  );
}
