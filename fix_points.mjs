import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDMQcthNTB1Pe4ymgzOVmR_f-vIq2Dnimc",
  authDomain: "rudra-1262f.firebaseapp.com",
  projectId: "rudra-1262f",
  storageBucket: "rudra-1262f.firebasestorage.app",
  messagingSenderId: "265739034178",
  appId: "1:265739034178:web:1a82b41ff6d6451fecd7db"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function fixPoints() {
  await signInWithEmailAndPassword(auth, "adarsh@rudra.edu", "123456");
  
  const snapshot = await getDocs(collection(db, "users"));
  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    if (data.name && data.name.toLowerCase().includes("aastha")) {
      console.log(`Found ${userDoc.id} - ${data.name} with ${data.points} points`);
      await updateDoc(userDoc.ref, { points: 22 });
      console.log("Updated points to 22");
    }
  }
}

fixPoints().catch(console.error).then(() => process.exit(0));
