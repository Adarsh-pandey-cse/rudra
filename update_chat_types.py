import re

with open("src/types/chat-types.ts", "r", encoding="utf-8") as f:
    content = f.read()

new_fields = """  onlineStatus: {
    student?: boolean;
    teacher?: string; // Teacher name if online
  };
  clearedAtStudent?: number; // Timestamp of when student cleared the chat for themselves
  clearedAtTeacher?: number; // Timestamp of when teacher cleared the chat for themselves
}"""

content = content.replace("  onlineStatus: {\n    student?: boolean;\n    teacher?: string; // Teacher name if online\n  };\n}", new_fields)

with open("src/types/chat-types.ts", "w", encoding="utf-8") as f:
    f.write(content)
