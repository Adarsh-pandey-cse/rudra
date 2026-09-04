import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";

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

async function fixPoints() {
  const q = query(collection(db, "users"), where("name", "==", "Aastha Pandey"));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.log("No Aastha Pandey found");
    return;
  }
  
  for (const userDoc of snapshot.docs) {
    console.log(`Found ${userDoc.id} - ${userDoc.data().name} with ${userDoc.data().points} points`);
    await updateDoc(userDoc.ref, { points: 22 });
    console.log("Updated points to 22");
  }
}

fixPoints().catch(console.error).then(() => process.exit(0));
