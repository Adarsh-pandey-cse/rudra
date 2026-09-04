import re

with open("src/app/dashboard/student/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the garbled AVATAR_EMOJIS array with a clean list of emojis
new_emojis = 'const AVATAR_EMOJIS = ["👨‍🎓", "👩‍🎓", "🎓", "🎒", "📚", "✍️", "🎯", "🚀", "💻", "🧠"];'

content = re.sub(r'const AVATAR_EMOJIS = \[[^\]]+\];', new_emojis, content)

with open("src/app/dashboard/student/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
