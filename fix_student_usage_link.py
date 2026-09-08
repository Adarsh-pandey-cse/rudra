import re

with open("src/app/dashboard/student/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

if "Activity," not in content:
    content = content.replace('import { ', 'import { Activity, ')

content = content.replace(
    '''            <Link href="/dashboard/student/chat">
              <GlassCard className="p-4 sm:p-6 hover:bg-white/[0.04] transition-all group cursor-pointer relative overflow-hidden h-[120px] sm:h-[160px] flex flex-col items-center justify-center gap-3">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/10 rounded-full blur-3xl group-hover:bg-[#10B981]/20 transition-all" />
                <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 text-[#10B981] group-hover:scale-110 transition-transform" />
                <h3 className="text-sm sm:text-lg font-bold text-white group-hover:text-[#10B981] transition-colors text-center">Chat</h3>
                {chatUnread > 0 && (
                  <span className="absolute top-3 right-3 flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-[#EF4444] text-white text-xs font-bold border-2 border-[#07111F] shadow-lg animate-pulse">
                    {chatUnread}
                  </span>
                )}
              </GlassCard>
            </Link>''',
    '''            <Link href="/dashboard/student/chat">
              <GlassCard className="p-4 sm:p-6 hover:bg-white/[0.04] transition-all group cursor-pointer relative overflow-hidden h-[120px] sm:h-[160px] flex flex-col items-center justify-center gap-3">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/10 rounded-full blur-3xl group-hover:bg-[#10B981]/20 transition-all" />
                <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 text-[#10B981] group-hover:scale-110 transition-transform" />
                <h3 className="text-sm sm:text-lg font-bold text-white group-hover:text-[#10B981] transition-colors text-center">Chat</h3>
                {chatUnread > 0 && (
                  <span className="absolute top-3 right-3 flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-[#EF4444] text-white text-xs font-bold border-2 border-[#07111F] shadow-lg animate-pulse">
                    {chatUnread}
                  </span>
                )}
              </GlassCard>
            </Link>

            <Link href="/dashboard/student/usage">
              <GlassCard className="p-4 sm:p-6 hover:bg-white/[0.04] transition-all group cursor-pointer relative overflow-hidden h-[120px] sm:h-[160px] flex flex-col items-center justify-center gap-3">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#38BDF8]/10 rounded-full blur-3xl group-hover:bg-[#38BDF8]/20 transition-all" />
                <Activity className="w-8 h-8 sm:w-12 sm:h-12 text-[#38BDF8] group-hover:scale-110 transition-transform" />
                <h3 className="text-sm sm:text-lg font-bold text-white group-hover:text-[#38BDF8] transition-colors text-center">App Usage</h3>
              </GlassCard>
            </Link>'''
)

with open("src/app/dashboard/student/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
