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

async function syncGroupKeys() {
  console.log('=== Syncing Group Keys ===\n');

  const usersSnapshot = await db.collection('users').get();
  let updatedCount = 0;
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const groups = userData.groups || [];
    
    if (groups.length === 0) {
      console.log(`Skipping ${userData.email}: no groups`);
      continue;
    }
    
    // Fetch group keys from group IDs
    const groupKeys: string[] = [];
    for (const groupId of groups) {
      const groupDoc = await db.collection('groups').doc(groupId).get();
      if (groupDoc.exists) {
        const groupData = groupDoc.data();
        if (groupData?.key) {
          groupKeys.push(groupData.key);
        }
      }
    }
    
    // Update user with groupKeys
    console.log(`Updating ${userData.email}:`, groupKeys);
    await userDoc.ref.update({ groupKeys });
    updatedCount++;
  }

  console.log(`\nUpdated ${updatedCount} users`);
  console.log('Group keys sync completed!');
}

syncGroupKeys().catch(console.error);
