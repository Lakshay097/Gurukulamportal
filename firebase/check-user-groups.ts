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

async function checkUserGroups() {
  console.log('=== Checking User Groups ===\n');

  // Get all users
  const usersSnapshot = await db.collection('users').get();
  
  console.log(`Total users: ${usersSnapshot.docs.length}\n`);
  
  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    console.log(`Email: ${data.email}`);
    console.log(`Group Keys: ${data.groupKeys ? data.groupKeys.join(', ') : 'none'}`);
    console.log(`Role: ${data.role || 'none'}`);
    console.log('---');
  }
}

checkUserGroups().catch(console.error);
