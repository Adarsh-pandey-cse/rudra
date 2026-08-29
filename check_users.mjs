import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc } from "firebase/firestore";
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

async function checkUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  for (const docSnap of snapshot.docs) {
    const user = docSnap.data();
    if (user.role === "student") {
      console.log(docSnap.id, user);
    }
  }
  process.exit(0);
}
checkUsers();
