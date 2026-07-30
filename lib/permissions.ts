import { adminDb, useAdminSDK, db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function canAccess(
  userGroupKeys: string[],
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  if (userGroupKeys.includes('admin-central')) {
    return true;
  }

  // Allow guests to access document sections (public documents)
  if (userGroupKeys.includes('guest') && resourceType === 'document_section') {
    return true;
  }

  if (useAdminSDK && adminDb) {
    // Use Admin SDK
    const snapshot = await adminDb
      .collection('permissionRules')
      .where('resourceType', '==', resourceType)
      .where('resourceId', '==', resourceId)
      .get();

    const hasAccess = snapshot.docs.some((doc) => {
      const rule = doc.data();
      return userGroupKeys.includes(rule.groupKey) && rule.accessLevel !== 'none';
    });
    return hasAccess;
  } else {
    // Use Client SDK
    const rulesQuery = query(
      collection(db, 'permissionRules'),
      where('resourceType', '==', resourceType),
      where('resourceId', '==', resourceId)
    );

    const rulesSnapshot = await getDocs(rulesQuery);
    
    const hasAccess = rulesSnapshot.docs.some(
      (doc) => {
        const rule = doc.data();
        return userGroupKeys.includes(rule.groupKey) && rule.accessLevel !== 'none';
      }
    );
    return hasAccess;
  }
}

