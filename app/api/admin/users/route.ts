import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb, useAdminSDK, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';

// GET - fetch all users with their groups
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userGroupKeys = (session as any).userGroupKeys || [];
  
  if (!userGroupKeys.includes('admin-central')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Fetch all users and groups in parallel
    const [users, groups] = await Promise.all([
      (async () => {
        let result: any[] = [];
        if (useAdminSDK && adminDb) {
          const snapshot = await adminDb.collection('users').get();
          result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
          const querySnapshot = await getDocs(query(collection(db, 'users')));
          result = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        return result;
      })(),
      (async () => {
        let result: any[] = [];
        if (useAdminSDK && adminDb) {
          const snapshot = await adminDb.collection('groups').get();
          result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
          const querySnapshot = await getDocs(query(collection(db, 'groups')));
          result = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        return result;
      })()
    ]);

    return NextResponse.json({
      users,
      groups,
    });
  } catch (error) {
    console.error('Error fetching users data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// PUT - update user groups
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userGroupKeys = (session as any).userGroupKeys || [];
  
  if (!userGroupKeys.includes('admin-central')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, groupIds } = body;

    if (!userId || !Array.isArray(groupIds)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (useAdminSDK && adminDb) {
      await adminDb.collection('users').doc(userId).update({
        groups: groupIds,
      });
    } else {
      await updateDoc(doc(db, 'users', userId), {
        groups: groupIds,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user groups:', error);
    return NextResponse.json({ error: 'Failed to update user groups' }, { status: 500 });
  }
}
