import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb, useAdminSDK, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

// GET - fetch all schools
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
    let schools: any[] = [];
    if (useAdminSDK && adminDb) {
      const schoolsSnapshot = await adminDb.collection('schools').get();
      schools = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const schoolsQuery = query(collection(db, 'schools'));
      const schoolsSnapshot = await getDocs(schoolsQuery);
      schools = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return NextResponse.json({ schools });
  } catch (error) {
    console.error('Error fetching schools data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// PUT - update school
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
    const { schoolId, updates } = body;

    if (!schoolId || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (useAdminSDK && adminDb) {
      await adminDb.collection('schools').doc(schoolId).update(updates);
    } else {
      await updateDoc(doc(db, 'schools', schoolId), updates);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating school:', error);
    return NextResponse.json({ error: 'Failed to update school' }, { status: 500 });
  }
}
