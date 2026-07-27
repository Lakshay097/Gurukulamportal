import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb, useAdminSDK, db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// GET - fetch all groups (authenticated users only)
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let groups: any[] = [];
    if (useAdminSDK && adminDb) {
      const groupsSnapshot = await adminDb.collection('groups').get();
      groups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const groupsQuery = collection(db, 'groups');
      const groupsSnapshot = await getDocs(groupsQuery);
      groups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}
