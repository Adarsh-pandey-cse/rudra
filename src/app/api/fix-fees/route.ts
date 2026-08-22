import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
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

export async function GET() {
  try {
    if (!getApps().length) {
      return NextResponse.json({ error: 'Firebase Admin not initialized.' }, { status: 500 });
    }

    const db = getFirestore();
    const invoicesSnapshot = await db.collection("invoices").get();
    
    let updated = 0;
    const batch = db.batch();
    
    invoicesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.month === "2026-08") {
        // Shift to July
        batch.update(doc.ref, { month: "2026-07" });
        updated++;
      }
    });
    
    await batch.commit();
    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
