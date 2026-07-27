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

async function removeUnusedSections() {
  console.log('=== Removing unused document sections ===\n');

  // Remove CBSERules since only SOP is available
  const snapshot = await db.collection('documentSections')
    .where('type', '==', 'CBSERules')
    .where('schoolId', '==', null)
    .get();

  if (!snapshot.empty) {
    for (const doc of snapshot.docs) {
      await db.collection('documentSections').doc(doc.id).delete();
      console.log(`✓ Deleted CBSERules entry: ${doc.id}`);
    }
  } else {
    console.log('No CBSERules entries found');
  }

  console.log('\n=== Cleanup complete ===');
  console.log('Only SOP section remains (with valid folder ID)');
}

removeUnusedSections().catch(console.error);
