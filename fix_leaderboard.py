import re

with open('src/store/leaderboardStore.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'addPoints: (studentId: string, points: number, reason: string) => void;',
    'addPoints: (studentId: string, points: number, reason: string) => void;\n    adjustPoints: (studentId: string, points: number, reason: string) => void;'
)

adjust_func = '''      adjustPoints: async (studentId, points, reason) => {
        try {
          const userRef = doc(db, "users", studentId);
          await updateDoc(userRef, {
            points: increment(points)
          });
          
          const currentEntry = get().entries.find(e => e.studentId === studentId);
          const previousRank = currentEntry ? currentEntry.rank : 0;
          
          eventBus.emit({
            type: "LEADERBOARD_UPDATED",
            payload: {
              studentId,
              points,
              newRank: previousRank, // Will be calculated after authStore sync
              previousRank
            }
          });
        } catch (error) {
          console.error("Error adjusting points:", error);
        }
      },'''

content = content.replace(
    '      updateStreak: async (studentId, change) => {',
    adjust_func + '\n\n      updateStreak: async (studentId, change) => {'
)

with open('src/store/leaderboardStore.ts', 'w', encoding='utf-8') as f:
    f.write(content)
