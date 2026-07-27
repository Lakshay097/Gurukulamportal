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

async function checkGroups() {
  console.log('=== Checking Groups ===\n');

  const groupsSnapshot = await db.collection('groups').get();
  
  console.log(`Total groups: ${groupsSnapshot.docs.length}\n`);
  
  for (const doc of groupsSnapshot.docs) {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`Key: ${data.key}`);
    console.log(`Name: ${data.name}`);
    console.log('---');
  }
}

checkGroups().catch(console.error);
