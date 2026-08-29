import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, updateEmail } from "firebase/auth";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
const envVars = {};
env.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const firebaseConfig = {
  apiKey: envVars["NEXT_PUBLIC_FIREBASE_API_KEY"],
  authDomain: envVars["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"],
  projectId: envVars["NEXT_PUBLIC_FIREBASE_PROJECT_ID"],
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function fixLongUsernames() {
  console.log("Fetching users...");
  const snapshot = await getDocs(collection(db, "users"));
  
  for (const docSnap of snapshot.docs) {
    const user = docSnap.data();
    if (user.role === "student" && user.username && user.username.length > 7) {
      console.log(`Found long username: ${user.username}`);
      
      const oldEmail = `${user.username}@rudra.edu`.toLowerCase();
      const baseStr = user.username.replace(/[0-9]+$/, '').substring(0, 4);
      const suffix = Math.floor(100 + Math.random() * 900);
      const newUsername = `${baseStr}${suffix}`;
      const newEmail = `${newUsername}@rudra.edu`.toLowerCase();
      
      try {
        console.log(`Signing in as ${oldEmail}...`);
        const cred = await signInWithEmailAndPassword(auth, oldEmail, user.password);
        
        console.log(`Updating email to ${newEmail}...`);
        await updateEmail(cred.user, newEmail);
        
        console.log(`Updating Firestore document...`);
        await updateDoc(doc(db, "users", docSnap.id), {
          username: newUsername
        });
        
        console.log(`Successfully fixed ${user.username} -> ${newUsername}`);
      } catch (err) {
        console.error(`Failed to fix ${user.username}:`, err);
      }
    }
  }
  console.log("Done.");
  process.exit(0);
}

fixLongUsernames();
