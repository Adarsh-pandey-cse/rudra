import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add a one-time fix for Aastha's 40 points
fix_code = """  // One-time fix to restore Aastha's 40 points
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

# Insert it before setMounted(true)
content = content.replace("  useEffect(() => {\n    setMounted(true);", fix_code + "\n\n  useEffect(() => {\n    setMounted(true);")

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
