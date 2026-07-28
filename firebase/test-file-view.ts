import { config } from 'dotenv';
import { getDriveClient } from '../lib/drive';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testFileView() {
  console.log('Testing file viewing with service account...\n');

  const testFileId = '1kQDmtKXElhoHoP4siFQAflw7QptJWryS'; // From the logs

  console.log(`Testing file: ${testFileId}`);
  try {
    const drive = getDriveClient();
    const fileResponse = await drive.files.get({
      fileId: testFileId,
      fields: 'name,mimeType',
    });

    console.log(`  File: ${fileResponse.data.name}`);
    console.log(`  MIME type: ${fileResponse.data.mimeType}`);

    // Test if we can export/fetch the file content
    if (fileResponse.data.mimeType?.startsWith('application/vnd.google-apps')) {
      console.log('  This is a Google Docs file, testing export...');
      const mimeTypeMap: Record<string, string> = {
        'application/vnd.google-apps.presentation': 'application/pdf',
      };
      const exportMimeType = mimeTypeMap[fileResponse.data.mimeType] || 'application/pdf';
      
      const response = await drive.files.export({
        fileId: testFileId,
        mimeType: exportMimeType,
      });
      console.log(`  Export successful: ✓ YES (${response.data.length} bytes)`);
    } else {
      console.log('  This is a regular file, testing media download...');
      const response = await drive.files.get({
        fileId: testFileId,
        alt: 'media',
      }, { responseType: 'arraybuffer' });
      console.log(`  Download successful: ✓ YES (${response.data.byteLength} bytes)`);
    }
  } catch (error: any) {
    console.log(`  Error: ${error.message}`);
    console.log(`  Accessible: ✗ NO`);
  }
}

testFileView().catch(console.error);
