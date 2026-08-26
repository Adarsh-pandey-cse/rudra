import re

with open("src/store/authStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_register = '''      const firebaseEmail = cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@rudra.edu`.toLowerCase();
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, firebaseEmail, cleanPassword);
      const studentId = userCredential.user.uid;'''

new_register = '''      let firebaseEmail = cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@rudra.edu`.toLowerCase();
      
      let userCredential;
      let finalUsername = cleanEmail;
      
      try {
        userCredential = await createUserWithEmailAndPassword(secondaryAuth, firebaseEmail, cleanPassword);
      } catch (err: any) {
        if (err.code === "auth/email-already-in-use") {
          // Auto-generate a unique suffix if email is in use
          const suffix = Math.floor(1000 + Math.random() * 9000);
          finalUsername = `${cleanEmail}${suffix}`;
          firebaseEmail = `${finalUsername}@rudra.edu`.toLowerCase();
          userCredential = await createUserWithEmailAndPassword(secondaryAuth, firebaseEmail, cleanPassword);
        } else {
          throw err;
        }
      }
      const studentId = userCredential.user.uid;'''

if 'finalUsername =' not in content:
    content = content.replace(old_register, new_register)
    content = content.replace("username: email,", "username: finalUsername,")

with open("src/store/authStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
