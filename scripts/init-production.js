const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');

try {
  const envConfig = fs.readFileSync('.env.local', 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
    }
  });
} catch (e) {
  console.log("No .env.local file found or error parsing");
}

// Configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const TEACHERS = [
  {
    email: "adarsh@rudra.edu",
    password: "Master@99",
    name: "Adarsh Pandey",
    username: "Adarsh@77"
  },
  {
    email: "akansha@rudra.edu",
    password: "Madam@88",
    name: "Akansha Pandey",
    username: "Akansha@27"
  }
];

async function provisionTeachers() {
  console.log("🚀 Starting Production Database Setup...");
  
  for (const teacher of TEACHERS) {
    try {
      console.log(`\n⏳ Checking account for ${teacher.name} (${teacher.email})...`);
      
      let userId = `temp_${teacher.username}`; // fallback if auth fails
      try {
        // Try to create first
        const userCredential = await createUserWithEmailAndPassword(auth, teacher.email, teacher.password);
        userId = userCredential.user.uid;
        console.log(`✅ Created Auth account for ${teacher.name}`);
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          console.log(`ℹ️ Auth account already exists for ${teacher.name}, signing in...`);
          const userCredential = await signInWithEmailAndPassword(auth, teacher.email, teacher.password);
          userId = userCredential.user.uid;
        } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
          console.error(`⚠️ Email/Password Authentication is not enabled in your Firebase Console!`);
          console.error(`   Please enable it in the Firebase Console -> Authentication -> Sign-in method.`);
          console.error(`   Proceeding to create Firestore document with a temporary ID anyway.`);
        } else {
          console.error(`❌ Auth error: ${err.message}`);
        }
      }

      // Provision Firestore Profile
      const userDoc = {
        id: userId,
        name: teacher.name,
        username: teacher.username,
        email: teacher.email,
        role: "teacher",
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", userId), userDoc, { merge: true });
      console.log(`✅ Provisioned Firestore profile for ${teacher.name} [ID: ${userId}]`);
      
    } catch (error) {
      console.error(`❌ Failed to provision ${teacher.name}:`, error.message);
    }
  }
  
  console.log("\n🎉 Setup Complete! You can safely terminate this script.");
  process.exit(0);
}

provisionTeachers();
