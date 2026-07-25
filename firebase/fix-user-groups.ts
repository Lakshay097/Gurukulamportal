import admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is required');
}

const serviceAccount = JSON.parse(
  Buffer.from(serviceAccountKey, "base64").toString("utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

async function fixUserGroups() {
  console.log('Starting user group fix...');

  // Find internal-staff group ID
  const groupSnapshot = await db.collection('groups').where('key', '==', 'internal-staff').get();
  
  if (groupSnapshot.empty) {
    console.error('internal-staff group not found. Please run seed.ts first.');
    return;
  }
  
  const internalStaffGroupId = groupSnapshot.docs[0].id;
  console.log(`Found internal-staff group ID: ${internalStaffGroupId}`);

  // Find all users with empty groups
  const usersSnapshot = await db.collection('users').get();
  let fixedCount = 0;
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const groups = userData.groups || [];
    
    if (groups.length === 0) {
      console.log(`Fixing user: ${userData.email}`);
      await userDoc.ref.update({
        groups: [internalStaffGroupId]
      });
      fixedCount++;
    }
  }

  console.log(`Fixed ${fixedCount} users with empty groups`);
  console.log('User group fix completed!');
}

fixUserGroups().catch(console.error);
