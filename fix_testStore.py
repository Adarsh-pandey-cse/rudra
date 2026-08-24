import re

with open('src/store/testStore.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add updateTestMark to interface
content = content.replace(
    'deleteTestMark: (id: string) => Promise<void>;',
    'updateTestMark: (id: string, marks: number) => Promise<void>;\n  deleteTestMark: (id: string) => Promise<void>;'
)

# Replace deleteTestMark implementation and add updateTestMark
# Also change addTestMark to use adjustPoints instead of addPoints
content = content.replace(
    'useLeaderboardStore.getState().addPoints(',
    'useLeaderboardStore.getState().adjustPoints('
)

old_delete = '''  deleteTestMark: async (id) => {
    try {
      await deleteDoc(doc(db, "test_marks", id));
      toast.success("Deleted test mark");
    } catch (err) {
      console.error("Failed to delete test mark", err);
      toast.error("Failed to delete test mark");
    }
  },'''

new_methods = '''  updateTestMark: async (id, marks) => {
    try {
      const existing = get().testMarks.find(m => m.id === id);
      if (!existing) throw new Error("Mark not found");
      
      const diff = marks - existing.marks;
      
      import("firebase/firestore").then(({ updateDoc, doc }) => {
        updateDoc(doc(db, "test_marks", id), { marks });
      });

      if (diff !== 0) {
        useLeaderboardStore.getState().adjustPoints(
          existing.studentId,
          diff,
          `Test marks updated by ${diff > 0 ? '+' : ''}${diff}`
        );
      }
      
      toast.success("Test marks updated successfully!");
    } catch (error: any) {
      toast.error("Failed to update test marks");
      throw error;
    }
  },

  deleteTestMark: async (id) => {
    try {
      const existing = get().testMarks.find(m => m.id === id);
      
      if (existing && existing.marks > 0) {
        useLeaderboardStore.getState().adjustPoints(
          existing.studentId,
          -existing.marks,
          `Test marks removed (-${existing.marks})`
        );
      }

      await deleteDoc(doc(db, "test_marks", id));
      toast.success("Deleted test mark");
    } catch (err) {
      console.error("Failed to delete test mark", err);
      toast.error("Failed to delete test mark");
    }
  },'''

content = content.replace(old_delete, new_methods)

with open('src/store/testStore.ts', 'w', encoding='utf-8') as f:
    f.write(content)
