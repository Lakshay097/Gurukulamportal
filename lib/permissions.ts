import { adminDb, useAdminSDK, db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function canAccess(
  userGroupKeys: string[],
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  console.log('[canAccess] userGroupKeys:', userGroupKeys);
  console.log('[canAccess] resourceType:', resourceType);
  console.log('[canAccess] resourceId:', resourceId);
  
  if (userGroupKeys.includes('admin-central')) {
    console.log('[canAccess] Access granted: admin-central');
    return true;
  }

  if (useAdminSDK && adminDb) {
    // Use Admin SDK
    const snapshot = await adminDb
      .collection('permissionRules')
      .where('resourceType', '==', resourceType)
      .where('resourceId', '==', resourceId)
      .get();

    console.log('[canAccess] Permission rules found:', snapshot.docs.length);
    const hasAccess = snapshot.docs.some((doc) => {
      const rule = doc.data();
      console.log('[canAccess] Checking rule:', rule);
      return userGroupKeys.includes(rule.groupKey) && rule.accessLevel !== 'none';
    });
    console.log('[canAccess] Access result:', hasAccess);
    return hasAccess;
  } else {
    // Use Client SDK
    const rulesQuery = query(
      collection(db, 'permissionRules'),
      where('resourceType', '==', resourceType),
      where('resourceId', '==', resourceId)
    );

    const rulesSnapshot = await getDocs(rulesQuery);
    console.log('[canAccess] Permission rules found:', rulesSnapshot.docs.length);
    
    const hasAccess = rulesSnapshot.docs.some(
      (doc) => {
        const rule = doc.data();
        console.log('[canAccess] Checking rule:', rule);
        return userGroupKeys.includes(rule.groupKey) && rule.accessLevel !== 'none';
      }
    );
    console.log('[canAccess] Access result:', hasAccess);
    return hasAccess;
  }
}

