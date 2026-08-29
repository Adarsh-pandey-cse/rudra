import re

with open("src/store/authStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

new_fallback = """          if (err.code === "auth/email-already-in-use") {
            // Auto-generate a 3-digit suffix ensuring max 7 characters total (e.g. Ary001 -> Ary + 123 = Ary123)
            const baseStr = cleanEmail.replace(/[0-9]+$/, '').substring(0, 4); // Keep up to 4 letters, strip trailing numbers
            const suffix = Math.floor(100 + Math.random() * 900); // 3 digits
            finalUsername = `${baseStr}${suffix}`;
            firebaseEmail = `${finalUsername}@rudra.edu`.toLowerCase();
            userCredential = await createUserWithEmailAndPassword(secondaryAuth, firebaseEmail, cleanPassword);
          } else {"""

content = re.sub(
    r'if\s*\(err\.code\s*===\s*"auth/email-already-in-use"\)\s*\{\s*// Auto-generate a unique suffix if email is in use\s*const suffix = Math\.floor\(1000 \+ Math\.random\(\) \* 9000\);\s*finalUsername = `\$\{cleanEmail\}\$\{suffix\}`;\s*firebaseEmail = `\$\{finalUsername\}@rudra\.edu`\.toLowerCase\(\);\s*userCredential = await createUserWithEmailAndPassword\(secondaryAuth, firebaseEmail, cleanPassword\);\s*\}\s*else\s*\{',
    new_fallback,
    content
)

with open("src/store/authStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
