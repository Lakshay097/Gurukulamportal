import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb, useAdminSDK, db } from '@/lib/firebase';
import { collection, query, where, getDocs, getDoc, addDoc, doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

// GET - fetch all access requests (admin only)
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
    let requests: any[] = [];
    if (useAdminSDK && adminDb) {
      const snapshot = await adminDb.collection('accessRequests').orderBy('requestedAt', 'desc').get();
      requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const q = query(collection(db, 'accessRequests'));
      const snapshot = await getDocs(q);
      requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching access requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

// POST - create a new access request (for users)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { groupKey, groupLabel } = body;

    if (!groupKey || !groupLabel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    const userName = session.user.name || userEmail;

    // Check if user already has this group
    const userGroupKeys = (session as any).userGroupKeys || [];
    if (userGroupKeys.includes(groupKey)) {
      return NextResponse.json({ error: 'User already has access to this group' }, { status: 400 });
    }

    // Check if there's already a pending request
    let existingRequest: any = null;
    if (useAdminSDK && adminDb) {
      const snapshot = await adminDb
        .collection('accessRequests')
        .where('userId', '==', userId)
        .where('groupKey', '==', groupKey)
        .where('status', '==', 'pending')
        .get();
      
      if (!snapshot.empty) {
        existingRequest = snapshot.docs[0].data();
      }
    } else {
      const q = query(
        collection(db, 'accessRequests'),
        where('userId', '==', userId),
        where('groupKey', '==', groupKey),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        existingRequest = snapshot.docs[0].data();
      }
    }

    if (existingRequest) {
      return NextResponse.json({ error: 'Request already pending' }, { status: 400 });
    }

    // Create the request
    let newRequestRef: any;
    if (useAdminSDK && adminDb) {
      newRequestRef = adminDb.collection('accessRequests').doc();
      await newRequestRef.set({
        userId,
        userEmail,
        userName,
        groupKey,
        groupLabel,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      });
    } else {
      newRequestRef = doc(collection(db, 'accessRequests'));
      await setDoc(newRequestRef, {
        userId,
        userEmail,
        userName,
        groupKey,
        groupLabel,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ id: newRequestRef.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating access request:', error);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}

// PUT - approve or deny a request (admin only)
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
    const { requestId, action } = body;

    if (!requestId || !action || !['approve', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Fetch the request
    let requestData: any = null;
    if (useAdminSDK && adminDb) {
      const doc = await adminDb.collection('accessRequests').doc(requestId).get();
      if (doc.exists) {
        requestData = { id: doc.id, ...doc.data() };
      }
    } else {
      const docRef = doc(db, 'accessRequests', requestId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        requestData = { id: snapshot.id, ...snapshot.data() };
      }
    }

    if (!requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (requestData.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
    }

    // Update request status
    if (useAdminSDK && adminDb) {
      await adminDb.collection('accessRequests').doc(requestId).update({
        status: action === 'approve' ? 'approved' : 'denied',
        processedAt: new Date().toISOString(),
        processedBy: session.user.email,
      });
    } else {
      await updateDoc(doc(db, 'accessRequests', requestId), {
        status: action === 'approve' ? 'approved' : 'denied',
        processedAt: new Date().toISOString(),
        processedBy: session.user.email,
      });
    }

    // If approved, add user to the group
    if (action === 'approve') {
      if (useAdminSDK && adminDb) {
        await adminDb.collection('users').doc(requestData.userId).update({
          groupKeys: arrayUnion(requestData.groupKey),
        });
      } else {
        await updateDoc(doc(db, 'users', requestData.userId), {
          groupKeys: arrayUnion(requestData.groupKey),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing access request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
