import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

listen_replace = """      const unsubTests = initializeTestsListener(currentUser.role, currentUser.id);
      
      let unsubChat: (() => void) | undefined;
      const { initializeTeacherThreadsListener, initializeStudentThreadListener } = useChatStore.getState();
      if (currentUser.role === "teacher") {
        unsubChat = initializeTeacherThreadsListener();
      } else if (currentUser.role === "student") {
        unsubChat = initializeStudentThreadListener(currentUser.id, currentUser.name);
      }
      
      let unsubReads: (() => void) | undefined;"""

content = content.replace("      const unsubTests = initializeTestsListener(currentUser.role, currentUser.id);\n      \n      let unsubReads: (() => void) | undefined;", listen_replace)

unsub_replace = """          if (unsubTests) unsubTests();
          if (unsubChat) unsubChat();
          if (unsubReads) unsubReads();"""

content = content.replace("          if (unsubTests) unsubTests();\n          if (unsubReads) unsubReads();", unsub_replace)


has_new_events_replace = """          const showDot = hasNewEvents(item.href);"""
new_has_new_events = """          const showDot = hasNewEvents(item.href);
          const isChat = item.href.includes("/chat");
          const unreadCountForNav = isChat ? chatUnread : 0;"""
content = content.replace(has_new_events_replace, new_has_new_events)

badge_replace = """              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 h-[42px] rounded-xl font-medium transition-all group relative",
                  isActive
                    ? "bg-[#5B5CFF]/12 text-[#5B5CFF]"
                    : "text-[#7B8798] hover:text-[#B6C2D9] hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-[18px] h-[18px] transition-colors",
                      isActive ? "text-[#5B5CFF]" : "text-[#7B8798] group-hover:text-[#B6C2D9]"
                    )}
                  />
                  <span className="text-sm">{item.label}</span>
                </div>
                
                {showDot && (
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                )}
              </Link>"""

new_badge = """              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 h-[42px] rounded-xl font-medium transition-all group relative",
                  isActive
                    ? "bg-[#5B5CFF]/12 text-[#5B5CFF]"
                    : "text-[#7B8798] hover:text-[#B6C2D9] hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-[18px] h-[18px] transition-colors",
                      isActive ? "text-[#5B5CFF]" : "text-[#7B8798] group-hover:text-[#B6C2D9]"
                    )}
                  />
                  <span className="text-sm">{item.label}</span>
                </div>
                
                {unreadCountForNav > 0 ? (
                  <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {unreadCountForNav}
                  </div>
                ) : showDot ? (
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                ) : null}
              </Link>"""
content = content.replace(badge_replace, new_badge)

bottom_nav_badge = """                    <div className="relative">
                      <Icon className={cn("w-[22px] h-[22px] mb-0.5 transition-colors", isActive ? "text-[#5B5CFF]" : "text-[#4B5563] group-hover:text-[#7B8798]")} />
                      {(item.href === "#notifications" && unreadCount > 0) || (item.href.includes("chat") && chatUnread > 0) && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full animate-pulse border-2 border-[#07111F]" />
                      )}
                    </div>"""

new_bottom_nav_badge = """                    <div className="relative">
                      <Icon className={cn("w-[22px] h-[22px] mb-0.5 transition-colors", isActive ? "text-[#5B5CFF]" : "text-[#4B5563] group-hover:text-[#7B8798]")} />
                      {item.href.includes("chat") && chatUnread > 0 ? (
                        <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 bg-[#EF4444] text-white text-[9px] font-bold rounded-full border-2 border-[#07111F] z-10">
                          {chatUnread}
                        </span>
                      ) : (item.href === "#notifications" && unreadCount > 0) && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full animate-pulse border-2 border-[#07111F]" />
                      )}
                    </div>"""
content = content.replace(bottom_nav_badge, new_bottom_nav_badge)


with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
