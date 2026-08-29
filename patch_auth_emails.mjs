import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc } from "firebase/firestore";
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
const db = getFirestore(app);

async function patchAuthEmails() {
  const snapshot = await getDocs(collection(db, "users"));
  for (const doc of snapshot.docs) {
    const user = doc.data();
    if (user.role === "student") {
      let authEmail = user.authEmail;
      if (!authEmail) {
        // If not set, try to infer it. 
        // For Aditya:
        if (user.name.includes("Aditya")) {
          authEmail = "adi0026882@rudra.edu";
        } else if (user.name.includes("Aryan")) {
          authEmail = "ary0056114@rudra.edu";
        } else if (user.name.includes("Aditi")) {
          authEmail = "adi003@rudra.edu";
        } else if (user.name.includes("Aastha")) {
          authEmail = "aas005@rudra.edu";
        } else if (user.name.includes("Anushka")) {
          authEmail = "anu004@rudra.edu";
        } else {
          authEmail = `${user.username}@rudra.edu`.toLowerCase();
        }
        
        console.log(`Setting authEmail for ${user.name} to ${authEmail}`);
        await updateDoc(doc.ref, { authEmail });
      }
    }
  }
  process.exit(0);
}
patchAuthEmails();
