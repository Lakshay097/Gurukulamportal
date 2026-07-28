import { config } from 'dotenv';
import { getDriveClient } from '../lib/drive';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testPdfExport() {
  console.log('Testing PDF export for Office files...\n');

  const testFileId = '1nTAXUBHXzd8fmpyoneK6iAROji_cVPk9'; // Gurukulam_Safety_SOP.docx from earlier logs

  console.log(`Testing file: ${testFileId}`);
  try {
    const drive = getDriveClient();
    const file = await drive.files.get({
      fileId: testFileId,
      fields: 'name,mimeType',
    });

    console.log(`  File: ${file.data.name}`);
    console.log(`  MIME type: ${file.data.mimeType}`);

    console.log('  Attempting PDF export...');
    const response = await drive.files.export({
      fileId: testFileId,
      mimeType: 'application/pdf',
    });

    const pdfData = response.data;
    const pdfLength = pdfData?.length || 0;
    console.log(`  Exported PDF length: ${pdfLength}`);

    if (Buffer.isBuffer(pdfData)) {
      const header = pdfData.slice(0, 4).toString();
      console.log(`  PDF header: ${header}`);
      
      if (header === '%PDF') {
        console.log('  ✓ Valid PDF file');
      } else {
        console.log('  ✗ Invalid PDF header');
      }
    }

    if (pdfLength > 0) {
      console.log('  ✓ PDF export successful');
    } else {
      console.log('  ✗ PDF export returned empty data');
    }
  } catch (error: any) {
    console.log(`  Error: ${error.message}`);
    console.log(`  ✗ PDF export failed`);
  }
}

testPdfExport().catch(console.error);
