with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("""                {showDot && (
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                )}""", """                {unreadCountForNav > 0 ? (
                  <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#EF4444] text-white text-[11px] font-bold shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-[#07111F]">
                    {unreadCountForNav}
                  </div>
                ) : showDot ? (
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                ) : null}""")

content = content.replace("""                      {(item.href === "#notifications" && unreadCount > 0) || (item.href.includes("chat") && chatUnread > 0) && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full animate-pulse border-2 border-[#07111F]" />
                      )}""", """                      {((item.href === "#notifications" && unreadCount > 0) || (item.href.includes("chat") && chatUnread > 0)) ? (
                        <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#EF4444] text-white text-[9px] font-bold border border-[#07111F]">
                          {item.href.includes("chat") ? chatUnread : unreadCount}
                        </span>
                      ) : null}""")

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
