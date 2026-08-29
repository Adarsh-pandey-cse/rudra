import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
    if (serviceAccount.project_id) {
      initializeApp({ credential: cert(serviceAccount) });
    }
  } catch (error) {
    console.error("Firebase Admin init error", error);
  }
}

export async function POST(req: Request) {
  try {
    const { uid, newUsername } = await req.json();
    if (!uid || !newUsername) {
      return NextResponse.json({ success: false, error: "Missing uid or newUsername" }, { status: 400 });
    }
    
    const auth = getAuth();
    const db = getFirestore();
    
    // Update Auth Email
    const newEmail = `${newUsername}@rudra.edu`.toLowerCase();
    await auth.updateUser(uid, { email: newEmail });
    
    // Update Firestore
    await db.collection("users").doc(uid).update({ username: newUsername });
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
