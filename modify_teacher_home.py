import re

with open("src/app/dashboard/teacher/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_replace = """import { ArrowRight, Bell, Calendar, ChevronRight, FileEdit, GraduationCap, LayoutDashboard, Megaphone, Plus, Settings, TrendingUp, Users, Copy, BookCheck, FileText, ClipboardCheck, MessageSquare } from "lucide-react";"""
content = re.sub(r'import \{.*?\} from "lucide-react";', import_replace, content)


quick_actions_replace = """  const quickActions = [
    { label: "Create\nHomework", icon: FileEdit, href: "/dashboard/teacher/homework/create", color: "text-[#5B5CFF]", bg: "bg-[#5B5CFF]/10", border: "border-[#5B5CFF]/20" },
    { label: "Check\nSubmissions", icon: ClipboardCheck, href: "/dashboard/teacher/homework", color: "text-[#F43F5E]", bg: "bg-[#F43F5E]/10", border: "border-[#F43F5E]/20" },
    { label: "Student\nChats", icon: MessageSquare, href: "/dashboard/teacher/chat", color: "text-[#10B981]", bg: "bg-[#10B981]/10", border: "border-[#10B981]/20", isChat: True },
    { label: "Post\nNotice", icon: Megaphone, href: "/dashboard/teacher/notices/create", color: "text-[#2DD4BF]", bg: "bg-[#2DD4BF]/10", border: "border-[#2DD4BF]/20" },
    { label: "Review\nDoubts", icon: BookCheck, href: "/dashboard/teacher/doubts", color: "text-[#4F9DFF]", bg: "bg-[#4F9DFF]/10", border: "border-[#4F9DFF]/20" },
    { label: "Mark\nAttendance", icon: UserPlus, href: "/dashboard/teacher/students", color: "text-[#FB923C]", bg: "bg-[#FB923C]/10", border: "border-[#FB923C]/20" },
  ];"""
content = re.sub(r'const quickActions = \[\n.*?\];', quick_actions_replace, content, flags=re.DOTALL)

badge_render_replace = """                  <GlassCard hoverEffect className="p-4 flex flex-col items-center justify-center gap-3 aspect-[4/3] group/card relative overflow-hidden">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover/card:scale-110", action.bg, action.color, action.border)}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#B6C2D9] text-center leading-tight group-hover/card:text-white transition-colors">
                      {action.label.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
                    </span>
                    
                    {/* Unread Chat Badge */}
                    {(action as any).isChat && chatUnread > 0 && (
                      <div className="absolute top-3 right-3 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                        {chatUnread}
                      </div>
                    )}
                    
                    {/* Hover Glow */}"""

content = content.replace("""                  <GlassCard hoverEffect className="p-4 flex flex-col items-center justify-center gap-3 aspect-[4/3] group/card relative overflow-hidden">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover/card:scale-110", action.bg, action.color, action.border)}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#B6C2D9] text-center leading-tight group-hover/card:text-white transition-colors">
                      {action.label.split('\\n').map((line, i) => <span key={i} className="block">{line}</span>)}
                    </span>
                    
                    {/* Hover Glow */}""", badge_render_replace)


with open("src/app/dashboard/teacher/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
