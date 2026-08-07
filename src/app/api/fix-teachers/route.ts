import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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
    const results = [];

    // Force update Adarsh
    try {
      const adarsh = await auth.getUserByEmail('adarsh@rudra.edu');
      await auth.updateUser(adarsh.uid, { password: 'Master@99' });
      results.push('Adarsh password reset to Master@99');
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        await auth.createUser({
          email: 'adarsh@rudra.edu',
          password: 'Master@99',
          displayName: 'Adarsh Pandey'
        });
        results.push('Adarsh account created with Master@99');
      } else {
        results.push(`Adarsh error: ${e.message}`);
      }
    }

    // Force update Akansha
    try {
      const akansha = await auth.getUserByEmail('akansha@rudra.edu');
      await auth.updateUser(akansha.uid, { password: 'Madam@88' });
      results.push('Akansha password reset to Madam@88');
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        await auth.createUser({
          email: 'akansha@rudra.edu',
          password: 'Madam@88',
          displayName: 'Akansha Pandey'
        });
        results.push('Akansha account created with Madam@88');
      } else {
        results.push(`Akansha error: ${e.message}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
