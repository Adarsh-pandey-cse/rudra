import re

with open("src/app/dashboard/student/doubts/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

if "useLeaderboardStore" not in content:
    content = content.replace(
        'import { useDoubtStore } from "@/store/doubtStore";',
        'import { useDoubtStore } from "@/store/doubtStore";\nimport { useLeaderboardStore } from "@/store/leaderboardStore";'
    )
    
    content = content.replace(
        'const { doubts, getDoubt, getDoubtReplies, markResolved, rateResponse, studentReply } = useDoubtStore();',
        'const { doubts, getDoubt, getDoubtReplies, markResolved, rateResponse, studentReply } = useDoubtStore();\n  const { adjustPoints } = useLeaderboardStore();'
    )
    
    content = content.replace(
        '''  const handleResolve = () => {
    if (ratingValue === 0) return;
    markResolved(doubtId);
    rateResponse(doubtId, ratingValue, feedbackText.trim());
  };''',
        '''  const handleResolve = () => {
    if (ratingValue === 0) return;
    markResolved(doubtId);
    rateResponse(doubtId, ratingValue, feedbackText.trim());
    if (currentUser) {
      adjustPoints(currentUser.id, ratingValue, `Rated a doubt (${ratingValue / 2} stars)`);
    }
  };'''
    )
    
with open("src/app/dashboard/student/doubts/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
