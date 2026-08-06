import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputBarProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export default function ChatInputBar({ onSendMessage, isLoading }: ChatInputBarProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl rounded-3xl opacity-50 pointer-events-none"></div>
      <form 
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2 p-2 bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all focus-within:border-blue-500/50 focus-within:bg-[#0B1120]"
      >
        <button 
          type="button"
          className="p-3 text-white/40 hover:text-white/80 transition-colors flex-shrink-0 mb-0.5"
          aria-label="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          className="flex-1 max-h-[120px] bg-transparent text-white placeholder-white/30 resize-none outline-none py-3 px-2 text-base leading-relaxed scrollbar-hide"
          rows={1}
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={cn(
            "p-3 rounded-xl flex items-center justify-center transition-all mb-0.5 flex-shrink-0",
            input.trim() && !isLoading
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105"
              : "bg-white/5 text-white/20 cursor-not-allowed"
          )}
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
