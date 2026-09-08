import re

with open("src/app/dashboard/student/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_replace = """import { 
  Clock, Target, ChevronRight, BookOpen, 
  Trophy, Bot, MessageCircleQuestion, Megaphone, CheckCircle, Brain, CalendarDays,
  Bell, FileText, Sparkles, Camera, X, UploadCloud, Flame, Crown, MessageSquare
} from 'lucide-react';"""
content = re.sub(r'import \{[^}]*\} from \'lucide-react\';', import_replace, content)

import_chatStore = """import { useLeaderboardStore } from '@/store/leaderboardStore';
import { useTestStore } from '@/store/testStore';
import { useChatStore } from '@/store/chatStore';"""
content = content.replace("""import { useLeaderboardStore } from '@/store/leaderboardStore';
import { useTestStore } from '@/store/testStore';""", import_chatStore)

chat_unread = """  const doubtsList = useDoubtStore(state => state.doubts);
  const leaderboardEntries = useLeaderboardStore(state => state.entries);
  const { initializeTestsListener, getMarksForStudent } = useTestStore();
  const chatUnread = useChatStore(state => state.unreadTotal);"""
content = content.replace("""  const doubtsList = useDoubtStore(state => state.doubts);
  const leaderboardEntries = useLeaderboardStore(state => state.entries);
  const { initializeTestsListener, getMarksForStudent } = useTestStore();""", chat_unread)


notes_card = """            <GlassCard hoverEffect onClick={() => router.push('/dashboard/student/notes')} className="p-4 flex items-center gap-4 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold text-white">Notes</div>
                <div className="text-[13px] text-[#7B8798]">View Materials</div>
              </div>
            </GlassCard>"""

chat_card = """            <GlassCard hoverEffect onClick={() => router.push('/dashboard/student/chat')} className="p-4 flex items-center gap-4 cursor-pointer relative overflow-hidden group">
              <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-[#10B981]" />
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold text-white">Chat</div>
                <div className="text-[13px] text-[#7B8798]">Teacher Chat</div>
              </div>
              {chatUnread > 0 && (
                <div className="absolute top-3 right-3 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                  {chatUnread}
                </div>
              )}
            </GlassCard>"""

content = content.replace(notes_card, chat_card)

with open("src/app/dashboard/student/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
