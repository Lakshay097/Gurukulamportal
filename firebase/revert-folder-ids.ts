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

/**
 * This script reverts the incorrect folder ID updates made by update-folder-ids.ts
 * It sets driveFolderId back to null for sections that were updated with placeholder IDs.
 */

async function revertFolderIds() {
  console.log('Reverting incorrect folder ID updates...');

  const placeholderIds = [
    'YOUR_DUE_DILIGENCE_FOLDER_ID_HERE',
    'YOUR_SCHOOL_OPTION_FOLDER_ID_HERE',
    'YOUR_CBSE_RULES_FOLDER_ID_HERE',
  ];

  try {
    const snapshot = await db.collection('documentSections')
      .where('schoolId', '==', null)
      .get();

    let revertedCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const currentFolderId = data.driveFolderId;

      if (placeholderIds.includes(currentFolderId)) {
        await doc.ref.update({ driveFolderId: null });
        console.log(`Reverted ${data.type} (ID: ${doc.id}) - set driveFolderId to null`);
        revertedCount++;
      }
    }

    console.log(`Reverted ${revertedCount} document sections`);
    console.log('Revert completed!');
  } catch (error) {
    console.error('Error reverting folder IDs:', error);
  }
}

revertFolderIds().catch(console.error);
