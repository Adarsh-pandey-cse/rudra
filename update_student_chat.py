import re

with open("src/app/dashboard/student/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Update handleClearChat
old_handle_clear = """  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to delete this chat entirely? This cannot be undone.")) {
      await clearChat(currentUser.id);
    }
  };"""
new_handle_clear = """  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      await clearChat(currentUser.id, "student", "me");
    }
  };"""
content = content.replace(old_handle_clear, new_handle_clear)

# Filter messages based on clearedAtStudent
old_map = """        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 z-0">
          {messages.length === 0 ? ("""
new_map = """        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 z-0">
          {(() => {
            const activeThread = threads[0];
            const visibleMessages = messages.filter(msg => {
              if (!activeThread?.clearedAtStudent) return true;
              return new Date(msg.createdAt).getTime() > activeThread.clearedAtStudent;
            });
            return visibleMessages.length === 0 ? ("""
content = content.replace(old_map, new_map)

old_messages_map = """          ) : (
            messages.map((msg, idx) => {"""
new_messages_map = """          ) : (
            visibleMessages.map((msg, idx) => {"""
content = content.replace(old_messages_map, new_messages_map)

old_idx_ref = "showTeacherName = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);"
new_idx_ref = "showTeacherName = !isMe && (idx === 0 || visibleMessages[idx - 1].senderId !== msg.senderId);"
content = content.replace(old_idx_ref, new_idx_ref)

old_messages_end = """              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>"""
new_messages_end = """              );
            });
          })()}
          <div ref={messagesEndRef} />
        </div>"""
content = content.replace(old_messages_end, new_messages_end)

with open("src/app/dashboard/student/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
