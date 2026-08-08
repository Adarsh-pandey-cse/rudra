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

    // 3. Archive student documents in Firestore (instead of deleting)
    const usersSnapshot = await db.collection('users').get();
    let firestoreArchived = 0;
    const batch = db.batch();
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      // Archive anyone who isn't Adarsh or Akansha
      if (data.username !== 'Adarsh@77' && data.username !== 'Akansha@27' && data.role !== 'teacher') {
        batch.update(doc.ref, { status: 'archived' });
        firestoreArchived++;
      }
    });

    if (firestoreArchived > 0) {
      await batch.commit();
      results.push(`Archived ${firestoreArchived} student documents in Firestore 'users' collection.`);
    }

    // 4. Wipe operational test data, BUT preserve feedback, homeworkSubmissions, and doubts for past students
    const collectionsToClear = [
      'receipts', 'feeProfiles', 'invoices', 'payments',
      'notices', 'noticeReads', 'notifications'
      // deliberately keeping 'doubts', 'homeworks', and 'homeworkSubmissions' to preserve student feedback/ratings
    ];

    for (const colName of collectionsToClear) {
      const colSnapshot = await db.collection(colName).get();
      if (!colSnapshot.empty) {
        const colBatch = db.batch();
        colSnapshot.docs.forEach((d) => colBatch.delete(d.ref));
        await colBatch.commit();
        results.push(`Cleared operational data from collection: ${colName} (${colSnapshot.size} documents)`);
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
