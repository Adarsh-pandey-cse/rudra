import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

one_time_fix = """
  // FINAL One-time fix to restore Aastha's 40 points without loops
  useEffect(() => {
    if (currentUser) {
      import("firebase/firestore").then(({ collection, getDocs, doc, updateDoc }) => {
        import("@/lib/firebase/firebase").then(async ({ db }) => {
          const snapshot = await getDocs(collection(db, "users"));
          for (const userDoc of snapshot.docs) {
            const data = userDoc.data();
            if (data.name?.includes("Aastha") && data.points < 40) {
              await updateDoc(userDoc.ref, { points: 40 });
            }
          }
        });
      });
    }
  }, [currentUser]);

  useEffect(() => {
    setMounted(true);
"""

content = content.replace("  useEffect(() => {\n    setMounted(true);", one_time_fix)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
