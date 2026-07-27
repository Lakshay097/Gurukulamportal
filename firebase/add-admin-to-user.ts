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

async function addAdminToUser() {
  const userEmail = process.argv[2]; // Get email from command line argument
  
  if (!userEmail) {
    console.error('Please provide user email as argument: npx tsx firebase/add-admin-to-user.ts <user-email>');
    console.log('Example: npx tsx firebase/add-admin-to-user.ts your-email@domain.com');
    return;
  }

  console.log(`Adding admin-central group to user: ${userEmail}`);

  // Find admin-central group ID
  const groupSnapshot = await db.collection('groups').where('key', '==', 'admin-central').get();
  
  if (groupSnapshot.empty) {
    console.error('admin-central group not found. Please run seed.ts first.');
    return;
  }
  
  const adminGroupId = groupSnapshot.docs[0].id;
  console.log(`Found admin-central group ID: ${adminGroupId}`);

  // Find user by email
  const userSnapshot = await db.collection('users').where('email', '==', userEmail).get();
  
  if (userSnapshot.empty) {
    console.error(`User with email ${userEmail} not found`);
    return;
  }

  const userDoc = userSnapshot.docs[0];
  const userData = userDoc.data();
  const currentGroups = userData.groups || [];

  if (currentGroups.includes(adminGroupId)) {
    console.log(`User ${userEmail} already has admin-central group`);
    return;
  }

  // Add admin-central group to user
  await userDoc.ref.update({
    groups: [...currentGroups, adminGroupId]
  });

  console.log(`Successfully added admin-central group to user ${userEmail}`);
  console.log('User will need to sign out and sign in again for changes to take effect');
}

addAdminToUser().catch(console.error);
