import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

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

export async function POST(request: Request) {
  try {
    if (!getApps().length) {
      return NextResponse.json({ error: 'Firebase Admin not initialized. Check FIREBASE_SERVICE_ACCOUNT.' }, { status: 500 });
    }

    const body = await request.json();
    const { token, title, message, link } = body;

    if (!token) {
      return NextResponse.json({ error: 'FCM token is required' }, { status: 400 });
    }

    const messagePayload = {
      token,
      notification: {
        title: title || 'New Notification',
        body: message || '',
      },
      data: {
        link: link || '/'
      },
      webpush: {
        headers: {
          Urgency: 'high'
        },
        fcmOptions: {
          link: link || '/'
        },
        notification: {
          icon: '/icons/icon-192x192.png'
        }
      }
    };

    const response = await getMessaging().send(messagePayload);
    return NextResponse.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
