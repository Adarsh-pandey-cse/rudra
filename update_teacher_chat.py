import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add showClearDialog state
content = content.replace(
    'const [search, setSearch] = useState("");',
    'const [search, setSearch] = useState("");\n  const [showClearDialog, setShowClearDialog] = useState(false);'
)

# Update handleClearChat
old_handle_clear = """  const handleClearChat = async () => {
    if (activeThreadId && window.confirm("Are you sure you want to delete this chat entirely? This cannot be undone.")) {
      await clearChat(activeThreadId);
    }
  };"""
new_handle_clear = """  const handleClearChat = async (type: "me" | "everyone") => {
    if (activeThreadId) {
      await clearChat(activeThreadId, "teacher", type);
      setShowClearDialog(false);
    }
  };"""
content = content.replace(old_handle_clear, new_handle_clear)

# Update the Trash button to open the dialog
old_trash = """                  <button 
                    onClick={handleClearChat}
                    title="Clear Chat History"
                    className="w-10 h-10 rounded-full bg-white/[0.02] hover:bg-[#EF4444]/10 text-[#7B8798] hover:text-[#EF4444] flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>"""
new_trash = """                  <button 
                    onClick={() => setShowClearDialog(true)}
                    title="Clear Chat History"
                    className="w-10 h-10 rounded-full bg-white/[0.02] hover:bg-[#EF4444]/10 text-[#7B8798] hover:text-[#EF4444] flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>"""
content = content.replace(old_trash, new_trash)

# Filter messages based on clearedAtTeacher
old_map = """                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 z-0">
                  {messages.length === 0 ? ("""
new_map = """                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 z-0">
                  {(() => {
                    const activeThread = threads.find(t => t.id === activeThreadId);
                    const visibleMessages = messages.filter(msg => {
                      if (!activeThread?.clearedAtTeacher) return true;
                      return new Date(msg.createdAt).getTime() > activeThread.clearedAtTeacher;
                    });
                    return visibleMessages.length === 0 ? ("""
content = content.replace(old_map, new_map)

old_messages_map = """                  ) : (
                    messages.map((msg, idx) => {"""
new_messages_map = """                  ) : (
                    visibleMessages.map((msg, idx) => {"""
content = content.replace(old_messages_map, new_messages_map)

old_idx_ref = "showTeacherName = isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);"
new_idx_ref = "showTeacherName = isMe && (idx === 0 || visibleMessages[idx - 1].senderId !== msg.senderId);"
content = content.replace(old_idx_ref, new_idx_ref)

old_messages_end = """                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>"""
new_messages_end = """                      );
                    });
                  })()}
                  <div ref={messagesEndRef} />
                </div>"""
content = content.replace(old_messages_end, new_messages_end)


# Add the Dialog JSX
dialog_jsx = """      {/* Clear Chat Dialog */}
      <AnimatePresence>
        {showClearDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#07111F]/80 backdrop-blur-sm"
              onClick={() => setShowClearDialog(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#0B1527] border border-white/[0.06] rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
            >
              <h3 className="text-xl font-bold text-white text-center">Clear Chat</h3>
              <p className="text-[#7B8798] text-sm text-center mb-2">How would you like to clear this conversation?</p>
              
              <button 
                onClick={() => handleClearChat("me")}
                className="w-full py-3 px-4 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-xl font-medium transition-colors"
              >
                Clear for Me
              </button>
              <button 
                onClick={() => handleClearChat("everyone")}
                className="w-full py-3 px-4 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] rounded-xl font-medium transition-colors"
              >
                Clear for Everyone
              </button>
              <button 
                onClick={() => setShowClearDialog(false)}
                className="w-full py-3 px-4 text-[#7B8798] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>"""

# Insert right before </DashboardLayout>
content = content.replace("    </DashboardLayout>\n  );\n}", dialog_jsx + "\n    </DashboardLayout>\n  );\n}")

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
