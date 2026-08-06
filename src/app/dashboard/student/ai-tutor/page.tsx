"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, BrainCircuit, BookOpen, Paperclip, SendHorizontal, Zap } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";

interface Message {
  id: string;
  sender: "student" | "ai";
  content: string;
  timestamp: string;
}

export default function StudentAiTutorPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "student") {
      router.replace("/auth/login");
      return;
    }
    setMounted(true);
  }, [isAuthenticated, currentUser, router, _hasHydrated]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (!mounted || !currentUser) return null;

  const [inputText, setInputText] = useState("");

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    const newUserMsg: Message = {
      id: Date.now().toString(),
      sender: "student",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);
    setInputText("");

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        content: "That's a great question! Based on your recent progress in Science, let's break this down step-by-step. First, consider...", // Simulated dynamic response
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, newAiMsg]);
    }, 1500);
  };

  const suggestedPrompts = [
    { text: "Explain this topic", icon: BrainCircuit },
    { text: "Give me practice questions", icon: Zap },
    { text: "Help with homework", icon: BookOpen },
  ];

  return (
    <DashboardLayout role="student">
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto w-full relative">
        
        {/* Header Area (Pinned) */}
        <div className="flex-shrink-0 flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#5B5CFF]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                AI Tutor
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
            <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="text-[11px] text-[#7B8798] uppercase tracking-wider font-medium">Powered by Gemini</span>
          </div>
        </div>

        {/* Chat Area (Scrollable) */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-hide pb-40 space-y-6 px-2"
        >
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto"
            >
              <div className="w-16 h-16 bg-white/[0.06] border border-white/[0.08] rounded-full flex items-center justify-center mb-6">
                <Bot className="w-8 h-8 text-[#5B5CFF]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
              <p className="text-sm text-[#7B8798]">
                I can explain complex topics, test your knowledge, or guide you through your homework step-by-step.
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col max-w-[85%] ${msg.sender === "student" ? "self-end items-end" : "self-start items-start"}`}
                  >
                    <div 
                      className={`px-5 py-3.5 mb-1 text-sm leading-relaxed ${
                        msg.sender === "student" 
                          ? "bg-[#5B5CFF]/12 border border-[#5B5CFF]/20 text-white rounded-[18px] rounded-br-[6px]" 
                          : "bg-white/[0.06] border border-white/[0.08] text-white rounded-[18px] rounded-bl-[6px]"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[11px] text-[#7B8798] px-1">{msg.timestamp}</span>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    key="typing-indicator"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="self-start flex flex-col items-start max-w-[85%]"
                  >
                    <div className="px-5 py-4 bg-white/[0.06] border border-white/[0.08] rounded-[18px] rounded-bl-[6px] flex items-center gap-1.5 mb-1">
                      <motion.div className="w-1.5 h-1.5 bg-[#B6C2D9] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                      <motion.div className="w-1.5 h-1.5 bg-[#B6C2D9] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                      <motion.div className="w-1.5 h-1.5 bg-[#B6C2D9] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Input Area (Pinned to bottom) */}
        <div className="absolute bottom-4 left-0 right-0 px-2 bg-gradient-to-t from-[#07111F] via-[#07111F] to-transparent pt-12 pb-2">
          
          {/* Suggested Prompts */}
          {messages.length === 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {suggestedPrompts.map((prompt, idx) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt.text)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-sm text-[#B6C2D9] hover:bg-white/[0.10] hover:text-white transition-colors"
                  >
                    <Icon className="w-4 h-4 text-[#7B8798]" />
                    {prompt.text}
                  </button>
                );
              })}
            </div>
          )}

          <div className="relative flex items-center">
            <button className="absolute left-3 p-2 text-[#7B8798] hover:text-white transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage(inputText);
              }}
              placeholder="Message AI Tutor..."
              className="w-full min-h-[48px] bg-white/[0.04] border border-white/[0.08] rounded-full pl-12 pr-14 py-3 text-sm text-white placeholder:text-[#7B8798] focus:outline-none focus:border-[#5B5CFF]/50 transition-colors"
            />
            <button 
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim()}
              className={`absolute right-2 p-2 rounded-full transition-all ${
                inputText.trim() 
                  ? "bg-gradient-to-r from-[#5B5CFF] to-[#8B5CF6] text-white shadow-lg shadow-[#5B5CFF]/20" 
                  : "bg-transparent text-[#7B8798]"
              }`}
            >
              <SendHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
