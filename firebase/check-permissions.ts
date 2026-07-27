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

async function checkPermissions() {
  console.log('=== Checking Permission Rules ===\n');

  // Check document sections
  console.log('1. Document Sections:');
  const sectionsSnapshot = await db.collection('documentSections')
    .where('schoolId', '==', null)
    .get();
  
  console.log(`   Total central sections: ${sectionsSnapshot.docs.length}`);
  for (const doc of sectionsSnapshot.docs) {
    const data = doc.data();
    console.log(`   - ${data.type} (id: ${doc.id}, driveFolderId: ${data.driveFolderId || 'null'})`);
  }

  // Check permission rules
  console.log('\n2. Permission Rules for document_section:');
  const rulesSnapshot = await db.collection('permissionRules')
    .where('resourceType', '==', 'document_section')
    .get();
  
  console.log(`   Total rules: ${rulesSnapshot.docs.length}`);
  for (const doc of rulesSnapshot.docs) {
    const data = doc.data();
    console.log(`   - resourceId: ${data.resourceId}, groupKey: ${data.groupKey}, accessLevel: ${data.accessLevel}`);
  }

  // Check if SOP section has permission rules
  console.log('\n3. SOP Section Permissions:');
  const sopSection = sectionsSnapshot.docs.find(doc => doc.data().type === 'SOP');
  if (sopSection) {
    const sopId = sopSection.id;
    console.log(`   SOP section ID: ${sopId}`);
    
    const sopRules = await db.collection('permissionRules')
      .where('resourceType', '==', 'document_section')
      .where('resourceId', '==', sopId)
      .get();
    
    console.log(`   Permission rules for SOP: ${sopRules.docs.length}`);
    if (sopRules.docs.length === 0) {
      console.log('   ⚠️  NO PERMISSION RULES FOUND FOR SOP SECTION');
      console.log('   This will cause access denied errors for all users except admin-central.');
    } else {
      for (const doc of sopRules.docs) {
        const data = doc.data();
        console.log(`   - groupKey: ${data.groupKey}, accessLevel: ${data.accessLevel}`);
      }
    }
  } else {
    console.log('   SOP section not found in database');
  }
}

checkPermissions().catch(console.error);
