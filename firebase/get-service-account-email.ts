import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  console.log('GOOGLE_SERVICE_ACCOUNT_KEY not set');
  process.exit(1);
}

const serviceAccount = JSON.parse(
  Buffer.from(serviceAccountKey, 'base64').toString('utf8')
);

console.log('Service Account Email:', serviceAccount.client_email);
console.log('\nShare your Drive folders/files with this email to give the service account access.');
