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

async function addSchoolImages() {
  console.log('Adding school images to Firebase...');

  // Map school slugs to their image paths
  const schoolImages: Record<string, string> = {
    'jaipur': '/images/Jaipur.jfif',
    'gwalior': '/images/Gwalior.png',
    'bhopal': '/images/Bhopal.jfif',
    'indore': '/images/Indore.jfif',
    'lucknow': '/images/Lucknow.jfif',
    'muzaffarpur': '/images/Muzaffarpur.jfif',
    'varanasi': '/images/Varanasi.jfif',
  };

  const snapshot = await db.collection('schools').get();
  
  let updatedCount = 0;
  for (const doc of snapshot.docs) {
    const school = doc.data();
    const slug = school.slug;
    
    if (schoolImages[slug]) {
      await db.collection('schools').doc(doc.id).update({
        heroImageUrl: schoolImages[slug]
      });
      console.log(`Updated ${school.name} with image: ${schoolImages[slug]}`);
      updatedCount++;
    } else {
      console.log(`No image available for ${school.name} (${slug})`);
    }
  }

  console.log(`Updated ${updatedCount} schools with images`);
  console.log('Done!');
}

addSchoolImages().catch(console.error);
