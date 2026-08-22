import re

with open('src/app/dashboard/teacher/doubts/[id]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();',
    'const { currentUser, isAuthenticated, _hasHydrated, users } = useAuthStore();'
)

with open('src/app/dashboard/teacher/doubts/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
