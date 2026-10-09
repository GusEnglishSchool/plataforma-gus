import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getFirestore();
    const snap = await db.collection("scenarios").get();
    const scenarios: any[] = [];
    snap.forEach(doc => {
      scenarios.push({ id: doc.id, ...doc.data() });
    });
    return NextResponse.json(scenarios);
  } catch (error: any) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
