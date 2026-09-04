import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# I will find the exact block and remove it.
old_block = """  // Temporary fix for Aastha's points
  useEffect(() => {
    if (currentUser?.role === "teacher") {
      import("firebase/firestore").then(({ collection, getDocs, doc, updateDoc }) => {
        import("@/lib/firebase/firebase").then(async ({ db }) => {
          const snapshot = await getDocs(collection(db, "users"));
          for (const userDoc of snapshot.docs) {
            const data = userDoc.data();
            if (data.name?.includes("Aastha") && data.points !== 20) {
              await updateDoc(userDoc.ref, { points: 20 });
            }
          }
        });
      });
    }
  }, [currentUser]);"""

if old_block in content:
    content = content.replace(old_block, "")
else:
    # If indentation is different, we can regex it
    content = re.sub(r'  // Temporary fix for Aastha\'s points[\s\S]*?\}, \[currentUser\]\);', '', content)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
