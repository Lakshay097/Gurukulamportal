import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb, useAdminSDK, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// GET - fetch current user's access requests
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = (session.user as any).id;
    
    let requests: any[] = [];
    if (useAdminSDK && adminDb) {
      const snapshot = await adminDb
        .collection('accessRequests')
        .where('userId', '==', userId)
        .orderBy('requestedAt', 'desc')
        .get();
      requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const q = query(
        collection(db, 'accessRequests'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching access requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}
