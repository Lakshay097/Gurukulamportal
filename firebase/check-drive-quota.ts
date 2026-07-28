import { config } from 'dotenv';
import { getDriveClient } from '../lib/drive';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function checkDriveQuota() {
  console.log('Checking service account Drive quota and temp files...\n');

  const drive = getDriveClient();

  try {
    // Check for orphaned temp files
    console.log('Checking for orphaned temp files...');
    const res = await drive.files.list({
      q: `name contains '__conv_' and trashed=false`,
      fields: 'files(id,name,createdTime,size)',
    });

    const tempFiles = res.data.files || [];
    console.log(`Found ${tempFiles.length} temp files:`);
    
    let totalSize = 0;
    for (const f of tempFiles) {
      const size = parseInt(f.size || '0');
      totalSize += size;
      console.log(`  - ${f.name} (${size} bytes, created: ${f.createdTime})`);
    }
    console.log(`Total temp file size: ${totalSize} bytes (${(totalSize / 1024 / 1024).toFixed(2)} MB)\n`);

    if (tempFiles.length > 0) {
      console.log('Cleaning up temp files...');
      let deleted = 0;
      for (const f of tempFiles) {
        try {
          await drive.files.delete({ fileId: f.id! });
          console.log(`  Deleted: ${f.name}`);
          deleted++;
        } catch (err) {
          console.error(`  Failed to delete ${f.name}:`, err);
        }
      }
      console.log(`Deleted ${deleted} temp files\n`);
    }

    // Get Drive usage info
    console.log('Getting Drive usage info...');
    const about = await drive.about.get({
      fields: 'storageQuota',
    });

    const quota = about.data.storageQuota;
    if (quota) {
      console.log(`Storage quota info:`);
      console.log(`  Limit: ${quota.limit ? parseInt(quota.limit) / 1024 / 1024 / 1024 : 'unlimited'} GB`);
      console.log(`  Usage: ${quota.usage ? parseInt(quota.usage) / 1024 / 1024 / 1024 : 'unknown'} GB`);
      console.log(`  Usage in drive: ${quota.usageInDrive ? parseInt(quota.usageInDrive) / 1024 / 1024 / 1024 : 'unknown'} GB`);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkDriveQuota().catch(console.error);
