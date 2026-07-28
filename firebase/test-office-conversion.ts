import { config } from 'dotenv';
import { getDriveClient, convertOfficeFileToPdf, isConvertibleOfficeMimeType } from '../lib/drive';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testOfficeConversion() {
  console.log('Testing Office file to PDF conversion...\n');

  // Test files from earlier logs
  const testFiles = [
    { id: '1kQDmtKXElhoHoP4siFQAflw7QptJWryS', name: 'Copy of _Training Inventory Procurement .pptx' },
    { id: '1nTAXUBHXzd8fmpyoneK6iAROji_cVPk9', name: 'Gurukulam_CodeOfConduct_SOP Staff.docx' },
  ];

  for (const testFile of testFiles) {
    console.log(`Testing file: ${testFile.name} (${testFile.id})`);
    try {
      const drive = getDriveClient();
      const file = await drive.files.get({
        fileId: testFile.id,
        fields: 'name,mimeType',
      });

      console.log(`  File: ${file.data.name}`);
      console.log(`  MIME type: ${file.data.mimeType}`);
      console.log(`  Is convertible: ${isConvertibleOfficeMimeType(file.data.mimeType)}`);

      if (isConvertibleOfficeMimeType(file.data.mimeType)) {
        console.log('  Attempting conversion to PDF...');
        const pdfBuffer = await convertOfficeFileToPdf(testFile.id, file.data.mimeType, drive);
        console.log(`  ✓ Conversion successful`);
        console.log(`  PDF size: ${pdfBuffer.length} bytes`);
        
        // Check PDF header
        const header = pdfBuffer.slice(0, 4).toString();
        console.log(`  PDF header: ${header}`);
        if (header === '%PDF') {
          console.log('  ✓ Valid PDF file');
        } else {
          console.log('  ✗ Invalid PDF header');
        }
      } else {
        console.log('  ✗ File type not supported for conversion');
      }
    } catch (error: any) {
      console.log(`  Error: ${error.message}`);
      console.log(`  ✗ Conversion failed`);
    }
    console.log();
  }
}

testOfficeConversion().catch(console.error);
