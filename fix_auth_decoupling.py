import re

with open("src/store/authStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Update login function to fetch user by username first
old_login = """  login: async (emailOrUsername: string, password: string) => {
    set({ isLoading: true });
    try {
      let firebaseEmail = emailOrUsername.trim();
      let cleanPassword = password.trim();
      let normalizedUsername = firebaseEmail.toLowerCase();
      
      let isAdarsh = normalizedUsername === "adarsh@77" || normalizedUsername === "adarsh@rudra.edu";
      let isAkansha = normalizedUsername === "akansha@27" || normalizedUsername === "akansha@rudra.edu";

      if (isAdarsh) firebaseEmail = "adarsh@rudra.edu";
      else if (isAkansha) firebaseEmail = "akansha@rudra.edu";
      else if (!firebaseEmail.includes('@')) {
        firebaseEmail = `${firebaseEmail}@rudra.edu`.toLowerCase();
      }

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, firebaseEmail, cleanPassword);
      } catch (error: any) {"""

new_login = """  login: async (emailOrUsername: string, password: string) => {
    set({ isLoading: true });
    try {
      let inputValue = emailOrUsername.trim();
      let cleanPassword = password.trim();
      let normalizedUsername = inputValue.toLowerCase();
      
      let isAdarsh = normalizedUsername === "adarsh@77" || normalizedUsername === "adarsh@rudra.edu";
      let isAkansha = normalizedUsername === "akansha@27" || normalizedUsername === "akansha@rudra.edu";

      let firebaseEmail = inputValue;
      
      if (isAdarsh) {
        firebaseEmail = "adarsh@rudra.edu";
      } else if (isAkansha) {
        firebaseEmail = "akansha@rudra.edu";
      } else {
        // Find user by username in Firestore to get their actual Auth email
        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("username", "==", inputValue));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            // If they have a specific authEmail stored, use it. Otherwise fallback to old pattern.
            if (userData.authEmail) {
              firebaseEmail = userData.authEmail;
            } else {
              // Legacy fallback: if it doesn't have @, append @rudra.edu
              firebaseEmail = inputValue.includes('@') ? inputValue : `${inputValue}@rudra.edu`.toLowerCase();
            }
          } else {
             // Not found in DB, fallback to direct attempt
             firebaseEmail = inputValue.includes('@') ? inputValue : `${inputValue}@rudra.edu`.toLowerCase();
          }
        } catch (e) {
           console.warn("Failed to lookup username, falling back to direct login", e);
           firebaseEmail = inputValue.includes('@') ? inputValue : `${inputValue}@rudra.edu`.toLowerCase();
        }
      }

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, firebaseEmail, cleanPassword);
      } catch (error: any) {"""

content = content.replace(old_login, new_login)

# Update registerStudent to save authEmail
old_register = """      const newStudent = {
        username: finalUsername,
        name,
        role: "student" as UserRole,"""

new_register = """      const newStudent = {
        username: finalUsername,
        authEmail: firebaseEmail,
        name,
        role: "student" as UserRole,"""
        
content = content.replace(old_register, new_register)

# Remove the fetch to update-student-auth in updateStudent since it's no longer needed
old_update = """    try {
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
    } catch (error: any) {"""

new_update = """    try {
      await updateDoc(doc(db, "users", studentId), {
        name,
        username: email
      });
      return { success: true };
    } catch (error: any) {"""

content = content.replace(old_update, new_update)

with open("src/store/authStore.ts", "w", encoding="utf-8") as f:
    f.write(content)
