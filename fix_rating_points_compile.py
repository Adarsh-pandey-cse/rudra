import re

with open("src/app/dashboard/student/doubts/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();',
    'const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();\n  const { adjustPoints } = useLeaderboardStore();'
)

with open("src/app/dashboard/student/doubts/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
