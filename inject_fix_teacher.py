import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the previous injection with a better one
old_injection = """  useEffect(() => {
    if (currentUser?.name?.includes("Aastha") && currentUser?.points === 44) {
      import("firebase/firestore").then(({ doc, updateDoc }) => {
        import("@/lib/firebase/firebase").then(({ db }) => {
          updateDoc(doc(db, "users", currentUser.id), { points: 22 }).then(() => {
            console.log("Fixed Aastha's points to 22");
          });
        });
      });
    }
  }, [currentUser]);"""

better_injection = """  useEffect(() => {
    if (currentUser?.role === "teacher") {
      import("firebase/firestore").then(({ collection, getDocs, doc, updateDoc }) => {
        import("@/lib/firebase/firebase").then(async ({ db }) => {
          const snapshot = await getDocs(collection(db, "users"));
          for (const userDoc of snapshot.docs) {
            const data = userDoc.data();
            if (data.name?.includes("Aastha") && data.points > 22) {
              await updateDoc(userDoc.ref, { points: 22 });
            }
          }
        });
      });
    }
  }, [currentUser]);"""

if old_injection in content:
    content = content.replace(old_injection, better_injection)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
