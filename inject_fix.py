import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

injection = """
  useEffect(() => {
    if (currentUser?.name?.includes("Aastha") && currentUser?.points === 44) {
      import("firebase/firestore").then(({ doc, updateDoc }) => {
        import("@/lib/firebase/firebase").then(({ db }) => {
          updateDoc(doc(db, "users", currentUser.id), { points: 22 }).then(() => {
            console.log("Fixed Aastha's points to 22");
          });
        });
      });
    }
  }, [currentUser]);
"""

if "Fixed Aastha's points" not in content:
    content = content.replace("useEffect(() => {", injection + "\n  useEffect(() => {", 1)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
