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

async function cleanupDuplicates() {
  console.log('=== Cleaning up duplicate document sections ===\n');

  // Find all central document sections
  const snapshot = await db.collection('documentSections')
    .where('schoolId', '==', null)
    .get();

  console.log(`Found ${snapshot.docs.length} central document sections\n`);

  // Group by type
  const byType: Record<string, any[]> = {};
  for (const doc of snapshot.docs) {
    const type = doc.data().type;
    if (!byType[type]) {
      byType[type] = [];
    }
    byType[type].push({ id: doc.id, ...doc.data() });
  }

  // Remove duplicates (keep first one)
  for (const [type, entries] of Object.entries(byType)) {
    if (entries.length > 1) {
      console.log(`Found ${entries.length} entries for ${type}:`);
      entries.forEach((entry, index) => {
        console.log(`  [${index}] ID: ${entry.id}, driveFolderId: ${entry.driveFolderId}`);
      });

      // Keep the first entry, delete the rest
      for (let i = 1; i < entries.length; i++) {
        await db.collection('documentSections').doc(entries[i].id).delete();
        console.log(`  ✓ Deleted duplicate entry ${entries[i].id}`);
      }
    } else {
      console.log(`${type}: OK (single entry)`);
    }
  }

  console.log('\n=== Cleanup complete ===');
}

cleanupDuplicates().catch(console.error);
