import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_script = """  // One-time fix to restore Aastha's 40 points
  useEffect(() => {
    if (currentUser?.role === "teacher") {
      import("firebase/firestore").then(({ collection, getDocs, doc, updateDoc }) => {
        import("@/lib/firebase/firebase").then(async ({ db }) => {
          const snapshot = await getDocs(collection(db, "users"));
          for (const userDoc of snapshot.docs) {
            const data = userDoc.data();
            if (data.name?.includes("Aastha") && data.points === 20) {
              await updateDoc(userDoc.ref, { points: 40 });
            }
          }
        });
      });
    }
  }, [currentUser]);"""

new_script = """  // One-time fix to restore Aastha's 40 points
  useEffect(() => {
    if (currentUser) {
      import("firebase/firestore").then(({ collection, getDocs, doc, updateDoc }) => {
        import("@/lib/firebase/firebase").then(async ({ db }) => {
          const snapshot = await getDocs(collection(db, "users"));
          for (const userDoc of snapshot.docs) {
            const data = userDoc.data();
            if (data.name?.includes("Aastha") && data.points === 20) {
              await updateDoc(userDoc.ref, { points: 40 });
            }
          }
        });
      });
    }
  }, [currentUser]);"""

content = content.replace(old_script, new_script)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
