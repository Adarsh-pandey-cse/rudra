import re

with open("src/store/authStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the registration fallback logic
old_fallback = """          if (err.code === "auth/email-already-in-use") {
            // Auto-generate a unique suffix if email is in use
            const suffix = Math.floor(1000 + Math.random() * 9000);
            finalUsername = `${cleanEmail}${suffix}`;
            firebaseEmail = `${finalUsername}@rudra.edu`.toLowerCase();
            userCredential = await createUserWithEmailAndPassword(secondaryAuth, firebaseEmail, cleanPassword);
          } else {"""

new_fallback = """          if (err.code === "auth/email-already-in-use") {
            // Auto-generate a 3-digit suffix ensuring max 7 characters total (e.g. Ary001 -> Ary + 123 = Ary123)
            const baseStr = cleanEmail.replace(/[0-9]+$/, '').substring(0, 4); // Keep up to 4 letters, strip trailing numbers
            const suffix = Math.floor(100 + Math.random() * 900); // 3 digits
            finalUsername = `${baseStr}${suffix}`;
            firebaseEmail = `${finalUsername}@rudra.edu`.toLowerCase();
            userCredential = await createUserWithEmailAndPassword(secondaryAuth, firebaseEmail, cleanPassword);
          } else {"""

if old_fallback in content:
    content = content.replace(old_fallback, new_fallback)
else:
    print("WARNING: Could not find old fallback logic!")

with open("src/store/authStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
