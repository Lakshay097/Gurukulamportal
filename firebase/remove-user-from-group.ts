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

async function removeUserFromGroup() {
  const email = process.argv[2];
  const groupKey = process.argv[3] || 'admin-central';

  if (!email) {
    console.log('Usage: npx tsx firebase/remove-user-from-group.ts <email> [groupKey]');
    console.log('Example: npx tsx firebase/remove-user-from-group.ts admin_analytics@pw.live admin-central');
    process.exit(1);
  }

  console.log(`Removing ${email} from group ${groupKey}...`);

  // Get group ID from group key
  const groupSnapshot = await db.collection('groups').where('key', '==', groupKey).get();
  if (groupSnapshot.empty) {
    console.log(`Group not found: ${groupKey}`);
    process.exit(1);
  }
  const groupId = groupSnapshot.docs[0].id;

  const snapshot = await db.collection('users').where('email', '==', email).get();

  if (snapshot.empty) {
    console.log(`User not found: ${email}`);
    process.exit(1);
  }

  const userDoc = snapshot.docs[0];
  const userData = userDoc.data();
  const currentGroups = userData.groups || [];

  if (!currentGroups.includes(groupId)) {
    console.log(`User not in group ${groupKey}`);
    console.log(`Current groups: ${currentGroups.join(', ')}`);
    return;
  }

  const updatedGroups = currentGroups.filter((id: string) => id !== groupId);
  await userDoc.ref.update({
    groups: updatedGroups
  });

  console.log(`✓ Removed ${email} from group ${groupKey}`);
  console.log(`Updated groups: ${updatedGroups.join(', ')}`);
  
  // Sync group keys
  const groupKeys: string[] = [];
  for (const gid of updatedGroups) {
    const groupDoc = await db.collection('groups').doc(gid).get();
    if (groupDoc.exists) {
      const groupData = groupDoc.data();
      if (groupData?.key) {
        groupKeys.push(groupData.key);
      }
    }
  }
  await userDoc.ref.update({ groupKeys });
  console.log(`Synced group keys: ${groupKeys.join(', ')}`);
}

removeUserFromGroup().catch(console.error);
