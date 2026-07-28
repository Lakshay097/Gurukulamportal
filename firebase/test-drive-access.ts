import { config } from 'dotenv';
import { getDriveClient, isFolderAccessible, listFilesInFolder } from '../lib/drive';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testDriveAccess() {
  console.log('Testing Drive API access with service account...\n');

  const testFolderIds = [
    '1U-l1H12E9D5uTkDNhp1U9q9hYDdtGOWP', // Training Module School
    '1hQ6jtWcDiQY3jgi5hLzkAPfC1-99d6TE', // KRA_KPI
    '1eW2fw7tYM0Lg3eOTYRZ7Av3CEJfUikm2', // SOP
  ];

  const testFileId = '1kQDmtKXElhoHoP4siFQAflw7QptJWryS'; // From the logs

  for (const folderId of testFolderIds) {
    console.log(`Testing folder: ${folderId}`);
    try {
      const accessible = await isFolderAccessible(folderId);
      console.log(`  Accessible: ${accessible ? '✓ YES' : '✗ NO'}`);
      
      if (accessible) {
        const files = await listFilesInFolder(folderId);
        console.log(`  Files found: ${files.length}`);
        if (files.length > 0) {
          console.log(`  First file: ${files[0].name} (${files[0].id})`);
        }
      }
    } catch (error: any) {
      console.log(`  Error: ${error.message}`);
    }
    console.log();
  }

  console.log(`Testing file access: ${testFileId}`);
  try {
    const drive = getDriveClient();
    const file = await drive.files.get({
      fileId: testFileId,
      fields: 'name,mimeType',
    });
    console.log(`  File: ${file.data.name}`);
    console.log(`  MIME type: ${file.data.mimeType}`);
    console.log(`  Accessible: ✓ YES`);
  } catch (error: any) {
    console.log(`  Error: ${error.message}`);
    console.log(`  Accessible: ✗ NO`);
  }
}

testDriveAccess().catch(console.error);
