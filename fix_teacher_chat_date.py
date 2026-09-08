import re

with open("src/app/dashboard/teacher/chat/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(
    r'(visibleMessages\.map\(\(msg, idx\) => \{)\s*(const isMe = msg\.senderRole === "teacher";)',
    r'''\1
                        const isNewDay = idx === 0 || new Date(msg.timestamp).toLocaleDateString() !== new Date(visibleMessages[idx - 1].timestamp).toLocaleDateString();
                        const msgDateStr = new Date(msg.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                        \2''',
    content
)

content = re.sub(
    r'(return \(\s*)(<motion\.div)',
    r'''\1<React.Fragment key={msg.id}>
                            {isNewDay && (
                              <div className="flex justify-center my-6 w-full relative z-10">
                                <span className="px-4 py-1.5 bg-[#1A2639]/80 backdrop-blur-md text-[#7B8798] text-[11px] font-medium rounded-full border border-white/[0.05] shadow-sm">
                                  {msgDateStr}
                                </span>
                              </div>
                            )}
                          \2''',
    content
)

content = re.sub(
    r'(</motion\.div>\s*)\);\s*\}\)\s*\}\s*</div>)',
    r'\1</React.Fragment>\n                        );\n                      })\n                    }\n                  </div>',
    content
)

with open("src/app/dashboard/teacher/chat/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
