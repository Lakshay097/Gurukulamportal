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

async function seed() {
  console.log('Starting Firebase seed...');

  // Create 3 starter Groups (only if they don't exist)
  const groups = [
    { key: 'admin-central', label: 'Admin Central', colorTier: 'admin' },
    { key: 'internal-staff', label: 'Internal Staff', colorTier: 'internal' },
    { key: 'other-internal', label: 'Other Internal', colorTier: 'other' },
  ];

  const groupIds: Record<string, string> = {};
  for (const group of groups) {
    const existing = await db.collection('groups').where('key', '==', group.key).get();
    if (existing.empty) {
      const docRef = db.collection('groups').doc();
      await docRef.set(group);
      groupIds[group.key] = docRef.id;
      console.log(`Created group: ${group.key}`);
    } else {
      groupIds[group.key] = existing.docs[0].id;
      console.log(`Group already exists: ${group.key}`);
    }
  }

  // Create 12 Schools
  const schoolSlugs = [
    'jaipur', 'gurugram', 'suratgarh', 'varanasi', 'gwalior', 'bhopal',
    'ranchi', 'lucknow', 'motihari', 'muzaffarpur', 'faridabad', 'indore'
  ];

  const schoolNames = [
    'Jaipur', 'Gurugram', 'Suratgarh', 'Varanasi', 'Gwalior', 'Bhopal',
    'Ranchi', 'Lucknow', 'Motihari', 'Muzaffarpur', 'Faridabad', 'Indore'
  ];

  const schoolIds: Record<string, string> = {};
  const batch2 = db.batch();
  schoolSlugs.forEach((slug, index) => {
    const docRef = db.collection('schools').doc();
    batch2.set(docRef, {
      slug,
      name: schoolNames[index],
      city: schoolNames[index],
      state: 'Rajasthan', // Default state, will be updated later
      status: 'Pre-Launch',
      facilities: [],
      createdAt: new Date(),
    });
    schoolIds[slug] = docRef.id;
  });
  await batch2.commit();
  console.log(`Created ${schoolSlugs.length} schools`);

  // Create DocumentSections per school
  const schoolDocTypes = ['SOP', 'Draft', 'DueDiligence'];
  const batch3 = db.batch();
  schoolSlugs.forEach((slug) => {
    schoolDocTypes.forEach((type) => {
      const docRef = db.collection('documentSections').doc();
      batch3.set(docRef, {
        type,
        schoolId: schoolIds[slug],
        driveFolderId: null,
        status: 'coming-soon',
      });
    });
  });
  await batch3.commit();
  console.log(`Created ${schoolSlugs.length * schoolDocTypes.length} school document sections`);

  // Create central DocumentSections (schoolId: null) - only if they don't exist
  const centralDocTypes = ['SOP', 'Draft', 'DueDiligence', 'Agreement', 'LOI', 'SchoolOption'];
  const centralDocIds: Record<string, string> = {};
  for (const type of centralDocTypes) {
    const existing = await db.collection('documentSections')
      .where('type', '==', type)
      .where('schoolId', '==', null)
      .get();
    
    if (existing.empty) {
      const docRef = db.collection('documentSections').doc();
      await docRef.set({
        type,
        schoolId: null,
        driveFolderId: null,
        status: 'coming-soon',
      });
      centralDocIds[type] = docRef.id;
      console.log(`Created central document section: ${type}`);
    } else {
      // Use the first existing one
      centralDocIds[type] = existing.docs[0].id;
      console.log(`Central document section already exists: ${type}`);
    }
  }

  // Create PermissionRules for school fields
  // Leadership: accessible by internal-staff and admin-central
  const batch5 = db.batch();
  schoolSlugs.forEach((slug) => {
    const schoolId = schoolIds[slug];
    ['internal-staff', 'admin-central'].forEach((groupKey) => {
      const docRef = db.collection('permissionRules').doc();
      batch5.set(docRef, {
        resourceType: 'school_field',
        resourceId: `leadership-${schoolId}`,
        groupKey,
        accessLevel: 'view',
      });
    });

    // Compliance: accessible by internal-staff and admin-central
    ['internal-staff', 'admin-central'].forEach((groupKey) => {
      const docRef = db.collection('permissionRules').doc();
      batch5.set(docRef, {
        resourceType: 'school_field',
        resourceId: `compliance-${schoolId}`,
        groupKey,
        accessLevel: 'view',
      });
    });

    // Enrollment: accessible by admin-central only
    const docRef = db.collection('permissionRules').doc();
    batch5.set(docRef, {
      resourceType: 'school_field',
      resourceId: `enrollment-${schoolId}`,
      groupKey: 'admin-central',
      accessLevel: 'view',
    });
  });
  await batch5.commit();
  console.log(`Created permission rules for school fields`);

  // Create PermissionRules for central document sections
  // All central documents accessible by admin-central and internal-staff
  const batch6 = db.batch();
  centralDocTypes.forEach((type) => {
    ['admin-central', 'internal-staff'].forEach((groupKey) => {
      const docRef = db.collection('permissionRules').doc();
      batch6.set(docRef, {
        resourceType: 'document_section',
        resourceId: centralDocIds[type], // Using actual document section ID
        groupKey,
        accessLevel: 'view',
      });
    });
  });
  await batch6.commit();
  console.log(`Created permission rules for central document sections`);

  // Create PermissionRules for navigation items
  // Schools and Documents nav items accessible by internal-staff and admin-central
  const batch7 = db.batch();
  ['schools', 'documents', 'cbse-rules'].forEach((navItemId) => {
    ['admin-central', 'internal-staff'].forEach((groupKey) => {
      const docRef = db.collection('permissionRules').doc();
      batch7.set(docRef, {
        resourceType: 'nav_item',
        resourceId: navItemId,
        groupKey,
        accessLevel: 'view',
      });
    });
  });
  await batch7.commit();
  console.log(`Created permission rules for navigation items`);

  console.log('Seed completed successfully!');
}

seed().catch(console.error);
