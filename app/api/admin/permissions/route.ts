import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb, useAdminSDK, db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';

// GET - fetch all groups and document sections
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
    // Fetch all groups, document sections, and permission rules in parallel
    const [groups, documentSections, permissionRules] = await Promise.all([
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
      })(),
      (async () => {
        let result: any[] = [];
        if (useAdminSDK && adminDb) {
          const snapshot = await adminDb.collection('documentSections').get();
          result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
          const querySnapshot = await getDocs(query(collection(db, 'documentSections')));
          result = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        return result;
      })(),
      (async () => {
        let result: any[] = [];
        if (useAdminSDK && adminDb) {
          const snapshot = await adminDb.collection('permissionRules').get();
          result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
          const querySnapshot = await getDocs(query(collection(db, 'permissionRules')));
          result = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        return result;
      })()
    ]);

    return NextResponse.json({
      groups,
      documentSections,
      permissionRules,
    });
  } catch (error) {
    console.error('Error fetching permissions data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - create a new group
export async function POST(request: NextRequest) {
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
    const { key, label, colorTier } = body;

    if (!key || !label || !colorTier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let newGroupRef: any;
    if (useAdminSDK && adminDb) {
      newGroupRef = adminDb.collection('groups').doc();
      await newGroupRef.set({
        key,
        label,
        colorTier,
      });
    } else {
      newGroupRef = doc(collection(db, 'groups'));
      await setDoc(newGroupRef, {
        key,
        label,
        colorTier,
      });
    }

    return NextResponse.json({ id: newGroupRef.id, key, label, colorTier }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

// PUT - update permission rules
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
    const { resourceType, resourceId, groupKey, accessLevel, documentSectionId } = body;

    if (!resourceType || !resourceId || !groupKey || accessLevel === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if a rule already exists for this combination
    let existingRule: any = null;
    if (useAdminSDK && adminDb) {
      const snapshot = await adminDb
        .collection('permissionRules')
        .where('resourceType', '==', resourceType)
        .where('resourceId', '==', resourceId)
        .where('groupKey', '==', groupKey)
        .get();
      
      if (!snapshot.empty) {
        existingRule = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }
    } else {
      const rulesQuery = query(
        collection(db, 'permissionRules'),
        where('resourceType', '==', resourceType),
        where('resourceId', '==', resourceId),
        where('groupKey', '==', groupKey)
      );
      const snapshot = await getDocs(rulesQuery);
      
      if (!snapshot.empty) {
        existingRule = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }
    }

    if (existingRule) {
      // Update existing rule
      if (useAdminSDK && adminDb) {
        await adminDb.collection('permissionRules').doc(existingRule.id).update({
          accessLevel,
          documentSectionId: documentSectionId || null,
        });
      } else {
        await setDoc(doc(db, 'permissionRules', existingRule.id), {
          ...existingRule,
          accessLevel,
          documentSectionId: documentSectionId || null,
        });
      }
    } else {
      // Create new rule
      if (useAdminSDK && adminDb) {
        await adminDb.collection('permissionRules').add({
          resourceType,
          resourceId,
          groupKey,
          accessLevel,
          documentSectionId: documentSectionId || null,
        });
      } else {
        await addDoc(collection(db, 'permissionRules'), {
          resourceType,
          resourceId,
          groupKey,
          accessLevel,
          documentSectionId: documentSectionId || null,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating permission rule:', error);
    return NextResponse.json({ error: 'Failed to update permission rule' }, { status: 500 });
  }
}
