import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin securely
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    if (serviceAccount.project_id) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

export async function GET() {
  try {
    if (!getApps().length) {
      return NextResponse.json({ error: 'Firebase Admin not initialized. Check FIREBASE_SERVICE_ACCOUNT.' }, { status: 500 });
    }

    const auth = getAuth();
    const db = getFirestore();
    let deletedCount = 0;
    const results: string[] = [];

    // 1. Fetch all users from Firebase Auth
    const listUsersResult = await auth.listUsers(1000);
    const usersToDelete = listUsersResult.users.filter(
      (user) => user.email !== 'adarsh@rudra.edu' && user.email !== 'akansha@rudra.edu'
    );

    // 2. Delete from Firebase Auth
    if (usersToDelete.length > 0) {
      const uids = usersToDelete.map((user) => user.uid);
      await auth.deleteUsers(uids);
      results.push(`Deleted ${uids.length} students/test users from Firebase Auth.`);
      deletedCount += uids.length;
    }

    // 3. Delete from Firestore 'users' collection
    const usersSnapshot = await db.collection('users').get();
    let firestoreDeleted = 0;
    const batch = db.batch();
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email !== 'adarsh@rudra.edu' && data.email !== 'akansha@rudra.edu') {
        batch.delete(doc.ref);
        firestoreDeleted++;
      }
    });

    if (firestoreDeleted > 0) {
      await batch.commit();
      results.push(`Deleted ${firestoreDeleted} student documents from Firestore 'users' collection.`);
    }

    // 4. (Optional) Let's also wipe collections that contain test data
    const collectionsToClear = [
      'doubts', 'receipts', 'feeProfiles', 'invoices', 'payments',
      'homeworks', 'homeworkSubmissions', 'notices', 'noticeReads', 'notifications'
    ];

    for (const colName of collectionsToClear) {
      const colSnapshot = await db.collection(colName).get();
      if (!colSnapshot.empty) {
        const colBatch = db.batch();
        colSnapshot.docs.forEach((d) => colBatch.delete(d.ref));
        await colBatch.commit();
        results.push(`Cleared test data from collection: ${colName} (${colSnapshot.size} documents)`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'App is now perfectly clean and production-ready!',
      results 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
