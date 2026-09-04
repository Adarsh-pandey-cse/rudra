import re

def refine_chat_height(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Change mb-20 to mb-[104px] (equivalent to pb-26) to perfectly sit above the bottom navbar
    content = content.replace(
        'absolute inset-2 mb-20',
        'absolute inset-2 mb-[104px]'
    )
    content = content.replace(
        'absolute inset-0 mb-20',
        'absolute inset-0 mb-[104px]'
    )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

refine_chat_height("src/app/dashboard/student/chat/page.tsx")
refine_chat_height("src/app/dashboard/teacher/chat/page.tsx")
