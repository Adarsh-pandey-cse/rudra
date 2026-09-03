import re

with open("src/store/homeworkStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Add interface definition
content = content.replace(
    'updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;',
    'updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;\n  toggleAssignmentStatus: (id: string, isClosed: boolean) => Promise<void>;'
)

# Add implementation
impl = """      updateAssignment: async (id, updates) => {
        try {
          const hwRef = doc(db, "homeworks", id);
          await updateDoc(hwRef, { ...updates, updatedAt: new Date().toISOString() });
        } catch (error) {
          console.error("Failed to update assignment", error);
        }
      },
      
      toggleAssignmentStatus: async (id, isClosed) => {
        try {
          const hwRef = doc(db, "homeworks", id);
          await updateDoc(hwRef, { isClosed, updatedAt: new Date().toISOString() });
          
          set((state) => ({
             assignments: state.assignments.map(a => a.id === id ? { ...a, isClosed, updatedAt: new Date().toISOString() } : a)
          }));
        } catch (error) {
          console.error("Failed to toggle assignment status", error);
        }
      },"""

content = re.sub(
    r'updateAssignment: async \(id, updates\) => \{.*?\n      \},',
    impl,
    content,
    flags=re.DOTALL
)

with open("src/store/homeworkStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
