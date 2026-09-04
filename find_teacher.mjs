import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function findTeacher() {
  const snapshot = await getDocs(collection(db, "users"));
  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    if (data.role === "teacher") {
      console.log(`Teacher: ${data.email} - ${data.password || "no pass field"}`);
    }
  }
}

findTeacher().catch(console.error).then(() => process.exit(0));
