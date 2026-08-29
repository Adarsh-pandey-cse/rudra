import re

with open("src/store/authStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_update = """  updateStudent: async (studentId: string, name: string, email: string) => {
    try {
      await updateDoc(doc(db, "users", studentId), {
        name,
        username: email
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to update student" };
    }
  },"""

new_update = """  updateStudent: async (studentId: string, name: string, email: string) => {
    try {
      // First update basic details in Firestore
      await updateDoc(doc(db, "users", studentId), {
        name,
        username: email
      });
      
      // Attempt to sync auth email via backend if it changed
      try {
        await fetch('/api/update-student-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: studentId, newUsername: email })
        });
      } catch (err) {
        console.warn("Failed to sync auth email", err);
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to update student" };
    }
  },"""

content = content.replace(old_update, new_update)

with open("src/store/authStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
