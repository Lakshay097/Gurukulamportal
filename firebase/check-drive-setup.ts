import admin from 'firebase-admin';
import { config } from 'dotenv';
import { getDriveClient, isFolderAccessible } from '../lib/drive';

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

async function checkDriveSetup() {
  console.log('=== Checking Drive Setup ===\n');

  // Check environment variables
  console.log('1. Environment Variables:');
  console.log(`   GOOGLE_SERVICE_ACCOUNT_KEY: ${serviceAccountKey ? 'SET' : 'NOT SET'}`);
  console.log(`   ROOT_DRIVE_FOLDER_ID: ${process.env.ROOT_DRIVE_FOLDER_ID || 'NOT SET'}\n`);

  // Check Drive client
  console.log('2. Testing Drive Client:');
  try {
    const drive = getDriveClient();
    console.log('   ✓ Drive client initialized successfully\n');
  } catch (error: any) {
    console.log(`   ✗ Failed to initialize Drive client: ${error.message}\n`);
    return;
  }

  // Check root folder accessibility
  const rootFolderId = process.env.ROOT_DRIVE_FOLDER_ID;
  if (rootFolderId) {
    console.log('3. Testing Root Folder Access:');
    const isAccessible = await isFolderAccessible(rootFolderId);
    console.log(`   Folder ID: ${rootFolderId}`);
    console.log(`   Accessible: ${isAccessible ? '✓ YES' : '✗ NO'}\n`);
  } else {
    console.log('3. Root Folder: NOT CONFIGURED\n');
  }

  // Check document sections in Firebase
  console.log('4. Document Sections in Firebase:');
  const snapshot = await db.collection('documentSections')
    .where('schoolId', '==', null)
    .get();

  console.log(`   Total central sections: ${snapshot.docs.length}`);
  
  let withFolderId = 0;
  let withoutFolderId = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.driveFolderId) {
      withFolderId++;
      console.log(`   ✓ ${data.type}: driveFolderId = ${data.driveFolderId}`);
      
      // Test accessibility
      const isAccessible = await isFolderAccessible(data.driveFolderId);
      console.log(`     Accessible: ${isAccessible ? '✓ YES' : '✗ NO'}`);
    } else {
      withoutFolderId++;
      console.log(`   ✗ ${data.type}: driveFolderId = null`);
    }
  }

  console.log(`\n   Summary: ${withFolderId} with folder ID, ${withoutFolderId} without\n`);

  // Recommendations
  console.log('5. Recommendations:');
  if (withoutFolderId > 0) {
    console.log('   - Run: npx tsx firebase/update-folder-ids.ts');
    console.log('   - First, update the FOLDER_IDS mapping in that file with actual folder IDs');
  }
  if (!rootFolderId) {
    console.log('   - Set ROOT_DRIVE_FOLDER_ID in .env.local and Vercel');
  }
  if (!serviceAccountKey) {
    console.log('   - Set GOOGLE_SERVICE_ACCOUNT_KEY in .env.local and Vercel');
  }
}

checkDriveSetup().catch(console.error);
