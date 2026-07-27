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

async function cleanupDummyData(dryRun = true) {
  console.log(`Starting ${dryRun ? 'DRY RUN' : 'cleanup'} of dummy data...`);
  console.log(dryRun ? 'No data will be deleted. This is a preview.' : 'Data will be permanently deleted.');

  // Keep schools and groups - only delete unused document types
  const docTypesToDelete = ['Draft', 'DueDiligence', 'Agreement', 'LOI', 'SchoolOption'];
  const docTypeToKeep = 'SOP';
  const groupKeysToKeep = ['admin-central', 'internal-staff'];

  let deletedSchools = 0;
  let deletedGroups = 0;
  let deletedDocSections = 0;
  let deletedPermissionRules = 0;
  let keptDocSections = 0;
  let keptPermissionRules = 0;

  try {
    // Keep all schools (no deletion)
    console.log('\n--- Schools (Keeping all) ---');
    const schoolsSnapshot = await db.collection('schools').get();
    console.log(`Found ${schoolsSnapshot.docs.length} schools - keeping all of them`);

    // Keep admin and internal-staff groups, delete other-internal if exists
    console.log('\n--- Groups ---');
    const groupsSnapshot = await db.collection('groups').get();
    for (const doc of groupsSnapshot.docs) {
      const group = doc.data();
      if (group.key === 'other-internal') {
        if (!dryRun) {
          await doc.ref.delete();
        }
        console.log(`${dryRun ? '[DRY RUN] Would delete' : 'Deleted'} group: ${group.label} (${group.key}) [ID: ${doc.id}]`);
        deletedGroups++;
      } else if (groupKeysToKeep.includes(group.key)) {
        console.log(`Keeping group: ${group.label} (${group.key}) [ID: ${doc.id}]`);
      }
    }

    // Delete non-SOP document sections (both central and school-specific)
    console.log('\n--- Document Sections ---');
    const docSectionsSnapshot = await db.collection('documentSections').get();
    for (const doc of docSectionsSnapshot.docs) {
      const section = doc.data();
      if (docTypesToDelete.includes(section.type)) {
        if (!dryRun) {
          await doc.ref.delete();
        }
        const location = section.schoolId ? `school-specific` : `central`;
        console.log(`${dryRun ? '[DRY RUN] Would delete' : 'Deleted'} ${location} document section: ${section.type} [ID: ${doc.id}]`);
        deletedDocSections++;
      } else if (section.type === docTypeToKeep) {
        const location = section.schoolId ? `school-specific` : `central`;
        console.log(`Keeping ${location} document section: ${section.type} [ID: ${doc.id}]`);
        keptDocSections++;
      }
    }

    // Delete permission rules for deleted document types, keep others
    console.log('\n--- Permission Rules ---');
    const permRulesSnapshot = await db.collection('permissionRules').get();
    for (const doc of permRulesSnapshot.docs) {
      const rule = doc.data();
      
      // Keep permission rules for groups we're keeping
      if (!groupKeysToKeep.includes(rule.groupKey)) {
        if (!dryRun) {
          await doc.ref.delete();
        }
        console.log(`${dryRun ? '[DRY RUN] Would delete' : 'Deleted'} permission rule for group: ${rule.groupKey} [ID: ${doc.id}]`);
        deletedPermissionRules++;
      } 
      // Keep permission rules for navigation items and school fields
      else if (rule.resourceType === 'nav_item' || rule.resourceType === 'school_field') {
        console.log(`Keeping permission rule: ${rule.resourceType}/${rule.resourceId} for ${rule.groupKey} [ID: ${doc.id}]`);
        keptPermissionRules++;
      }
      // For document section rules, we need to check if the document section still exists
      else if (rule.resourceType === 'document_section') {
        // Check if this document section still exists
        const docSection = await db.collection('documentSections').doc(rule.resourceId).get();
        if (docSection.exists) {
          const sectionData = docSection.data();
          if (sectionData && sectionData.type === docTypeToKeep) {
            console.log(`Keeping permission rule for document section: ${sectionData.type} [ID: ${doc.id}]`);
            keptPermissionRules++;
          } else {
            if (!dryRun) {
              await doc.ref.delete();
            }
            console.log(`${dryRun ? '[DRY RUN] Would delete' : 'Deleted'} permission rule for deleted document type [ID: ${doc.id}]`);
            deletedPermissionRules++;
          }
        } else {
          if (!dryRun) {
            await doc.ref.delete();
          }
          console.log(`${dryRun ? '[DRY RUN] Would delete' : 'Deleted'} permission rule for non-existent document section [ID: ${doc.id}]`);
          deletedPermissionRules++;
        }
      } else {
        console.log(`Keeping permission rule: ${rule.resourceType}/${rule.resourceId} for ${rule.groupKey} [ID: ${doc.id}]`);
        keptPermissionRules++;
      }
    }

    console.log('\n=== Cleanup Summary ===');
    console.log(`Schools: ${deletedSchools} deleted, ${schoolsSnapshot.docs.length} kept`);
    console.log(`Groups: ${deletedGroups} deleted, ${groupsSnapshot.docs.length - deletedGroups} kept`);
    console.log(`Document sections: ${deletedDocSections} deleted, ${keptDocSections} kept`);
    console.log(`Permission rules: ${deletedPermissionRules} deleted, ${keptPermissionRules} kept`);
    
    if (dryRun) {
      console.log('\nThis was a DRY RUN. No data was deleted.');
      console.log('To actually delete the data, run with dryRun=false or modify the script.');
    } else {
      console.log('Cleanup completed successfully!');
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

cleanupDummyData(false).catch(console.error);
