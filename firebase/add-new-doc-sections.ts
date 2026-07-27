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
 * This script adds new central document sections for KRA&KPIs and Training Module
 * with their respective Google Drive folder IDs.
 */

async function addNewDocumentSections() {
  console.log('Starting to add new document sections...');

  // New document sections to add
  const newSections = [
    {
      type: 'KRA_KPI',
      driveFolderId: '1hQ6jtWcDiQY3jgi5hLzkAPfC1-99d6TE',
      label: 'KRA & KPIs',
    },
    {
      type: 'TRAINING_MODULE',
      driveFolderId: '1U-l1H12E9D5uTkDNhp1U9q9hYDdtGOWP',
      label: 'Training Module',
    },
  ];

  const sectionIds: Record<string, string> = {};

  for (const section of newSections) {
    // Check if section already exists
    const existing = await db.collection('documentSections')
      .where('type', '==', section.type)
      .where('schoolId', '==', null)
      .get();

    if (existing.empty) {
      // Create new section
      const docRef = db.collection('documentSections').doc();
      await docRef.set({
        type: section.type,
        schoolId: null,
        driveFolderId: section.driveFolderId,
        status: 'available',
      });
      sectionIds[section.type] = docRef.id;
      console.log(`Created document section: ${section.label} with folder ID: ${section.driveFolderId}`);
    } else {
      // Update existing section with drive folder ID
      const existingDoc = existing.docs[0];
      await existingDoc.ref.update({ driveFolderId: section.driveFolderId, status: 'available' });
      sectionIds[section.type] = existingDoc.id;
      console.log(`Updated existing document section: ${section.label} with folder ID: ${section.driveFolderId}`);
    }
  }

  // Add permission rules for the new sections
  // Accessible by admin-central and internal-staff
  console.log('Adding permission rules...');
  const batch = db.batch();

  for (const section of newSections) {
    const sectionId = sectionIds[section.type];
    ['admin-central', 'internal-staff'].forEach((groupKey) => {
      const docRef = db.collection('permissionRules').doc();
      batch.set(docRef, {
        resourceType: 'document_section',
        resourceId: sectionId,
        groupKey,
        accessLevel: 'view',
      });
    });
  }

  await batch.commit();
  console.log('Permission rules added successfully!');

  console.log('New document sections added successfully!');
}

addNewDocumentSections().catch(console.error);
