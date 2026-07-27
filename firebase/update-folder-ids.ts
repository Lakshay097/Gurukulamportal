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
 * This script updates the driveFolderId for central document sections.
 * 
 * ROOT CAUSE OF BUG:
 * All central document sections currently have driveFolderId: null, which causes
 * them to fall back to the root folder ("sop_school"). This results in the same
 * root folder appearing identically under every section (LOI, CBSE Rules, etc.).
 * 
 * REQUIRED FIX:
 * Each section must be mapped to its OWN dedicated subfolder inside the drive.
 * The root folder must NEVER be rendered as a nested folder card.
 * 
 * BEFORE RUNNING:
 * 1. In Google Drive, create subfolders under the root for each section:
 *    - root/letters-of-intent (for LOI documents)
 *    - root/cbse-rules (for CBSE Rules documents)
 *    - root/school-options (for School Option documents)
 *    - root/sop (for SOP documents)
 *    - root/draft (for Draft documents)
 *    - root/due-diligence (for Due Diligence documents)
 *    - root/agreements (for Agreement documents)
 * 2. Move the relevant files into each subfolder
 * 3. Get the folder IDs for each subfolder from Google Drive
 * 4. Update the FOLDER_IDS mapping below with the actual folder IDs
 * 5. Set ROOT_DRIVE_FOLDER_ID in your .env.local to the root folder ID
 */

// Folder IDs for each document section
// These should be the actual folder IDs from Google Drive
const FOLDER_IDS: Record<string, string> = {
  SOP: "1eW2fw7tYM0Lg3eOTYRZ7Av3CEJfUikm2",
  CBSERules: "YOUR_CBSERULES_FOLDER_ID_HERE",
  Draft: "YOUR_DRAFT_FOLDER_ID_HERE",
  DueDiligence: "YOUR_DUEDILIGENCE_FOLDER_ID_HERE",
  Agreement: "YOUR_AGREEMENT_FOLDER_ID_HERE",
  LOI: "YOUR_LOI_FOLDER_ID_HERE",
  SchoolOption: "YOUR_SCHOOLORGANIZATION_FOLDER_ID_HERE",
};

async function updateFolderIds() {
  console.log('Starting folder ID updates...');

  const centralDocTypes = ['SOP', 'Draft', 'DueDiligence', 'Agreement', 'LOI', 'SchoolOption', 'CBSERules'];

  for (const type of centralDocTypes) {
    const folderId = FOLDER_IDS[type];
    
    // Check if folder ID is still a placeholder (starts with 'YOUR_' and ends with '_HERE')
    if (!folderId || folderId.startsWith('YOUR_') && folderId.endsWith('_HERE')) {
      console.log(`Skipping ${type}: folder ID not configured`);
      continue;
    }

    try {
      const snapshot = await db.collection('documentSections')
        .where('type', '==', type)
        .where('schoolId', '==', null)
        .get();

      if (snapshot.empty) {
        console.log(`No central document section found for: ${type}`);
        continue;
      }

      for (const doc of snapshot.docs) {
        await doc.ref.update({ driveFolderId: folderId });
        console.log(`Updated ${type} with folder ID: ${folderId}`);
      }
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
    }
  }

  console.log('Folder ID updates completed!');
}

updateFolderIds().catch(console.error);
