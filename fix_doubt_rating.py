import re

with open("src/app/dashboard/student/doubts/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_func = """  const handleResolve = () => {
    if (ratingValue === 0) return;
    markResolved(doubtId);
    rateResponse(doubtId, ratingValue, feedbackText.trim());
    if (currentUser) {
      adjustPoints(currentUser.id, ratingValue, `Rated a doubt (${ratingValue / 2} stars)`);
    }
  };"""

new_func = """  const handleResolve = () => {
    if (ratingValue === 0) return;
    markResolved(doubtId);
    rateResponse(doubtId, ratingValue, feedbackText.trim());
    
    // Find the teacher who answered to give them points
    const teacherReply = chatMessages.find(msg => msg.authorRole === "teacher");
    if (teacherReply && teacherReply.authorId) {
      adjustPoints(teacherReply.authorId, ratingValue, `Doubt rating received`);
    }
  };"""

if old_func in content:
    content = content.replace(old_func, new_func)
else:
    print("Could not find old handleResolve. Here is what we found:")
    idx = content.find("const handleResolve")
    print(content[idx:idx+300])

with open("src/app/dashboard/student/doubts/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
