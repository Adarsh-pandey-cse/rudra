import re

def fix_chat_height(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # The issue is h-[calc(100vh-120px)] causes overflow on mobile because DashboardLayout has pb-32.
    # We will replace it with an absolute position that perfectly fills the available space.
    content = content.replace(
        'max-w-4xl mx-auto h-[calc(100vh-120px)] flex',
        'absolute inset-2 mb-20 md:inset-6 md:mb-6 lg:inset-8 lg:mb-8 max-w-4xl mx-auto flex'
    )
    content = content.replace(
        'max-w-6xl mx-auto h-[calc(100vh-120px)] flex',
        'absolute inset-0 mb-20 md:inset-6 md:mb-6 lg:inset-8 lg:mb-8 max-w-6xl mx-auto flex'
    )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

fix_chat_height("src/app/dashboard/student/chat/page.tsx")
fix_chat_height("src/app/dashboard/teacher/chat/page.tsx")
