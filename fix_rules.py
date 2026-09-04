import re

with open("firestore.rules", "r", encoding="utf-8") as f:
    content = f.read()

chat_rule = """
    // Chats
    match /chats/{threadId} {
      allow read, write: if isAuthenticated();
      match /messages/{messageId} {
        allow read, write: if isAuthenticated();
      }
    }
"""

if "// Chats" not in content:
    content = content.replace(
        "// Fallback: Default deny",
        chat_rule + "\n    // Fallback: Default deny"
    )

with open("firestore.rules", "w", encoding="utf-8") as f:
    f.write(content)
