import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

export async function GET(req: Request) {
  try {
    const db = getFirestore();
    const auth = getAuth();
    
    const usersSnap = await db.collection('users').where('role', '==', 'student').get();
    
    let fixedCount = 0;
    const results = [];
    
    for (const doc of usersSnap.docs) {
      const user = doc.data();
      if (user.username && user.username.length > 7) {
        const oldUsername = user.username;
        
        // Ensure max 7 characters
        const baseStr = oldUsername.replace(/[0-9]+$/, '').substring(0, 4);
        const suffix = Math.floor(100 + Math.random() * 900);
        const newUsername = `${baseStr}${suffix}`;
        const newEmail = `${newUsername}@rudra.edu`.toLowerCase();
        
        try {
          // Update Firebase Auth
          await auth.updateUser(doc.id, {
            email: newEmail
          });
          
          // Update Firestore
          await doc.ref.update({
            username: newUsername
          });
          
          results.push(`Fixed: ${oldUsername} -> ${newUsername}`);
          fixedCount++;
        } catch (authErr: any) {
          results.push(`Error fixing ${oldUsername}: ${authErr.message}`);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} usernames.`,
      details: results
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
