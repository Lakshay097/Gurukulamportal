import { createClient } from '@supabase/supabase-js';

// Use provided Supabase credentials
const supabaseUrl = 'https://grcwwrpkjnosokoazmpq.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyY3d3cnBram5vc29rb2F6bXBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg4NTU5OCwiZXhwIjoyMTAwNDYxNTk4fQ.kBpcqKxb4k_WWmpyJPT3Fs32R2CMlE8YKEqRVZcUmBw';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Script to create the drive-pdf-cache bucket in Supabase Storage
 */
async function setupPdfCacheBucket() {
  const bucketName = 'drive-pdf-cache';

  console.log(`Checking if bucket '${bucketName}' exists...`);

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Error listing buckets:', listError);
    process.exit(1);
  }

  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

  if (bucketExists) {
    console.log(`Bucket '${bucketName}' already exists. Skipping creation.`);
    return;
  }

  console.log(`Bucket '${bucketName}' does not exist. Creating...`);

  // Create the bucket
  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: false, // PDF cache should be private, accessed via service role
    fileSizeLimit: 10485760, // 10MB limit for PDFs
  });

  if (createError) {
    console.error('Error creating bucket:', createError);
    process.exit(1);
  }

  console.log(`Bucket '${bucketName}' created successfully!`);
  console.log('\nNext steps:');
  console.log('1. Go to Supabase Dashboard > Storage > drive-pdf-cache');
  console.log('2. Set up RLS policies using the SQL below:');
  console.log(`
-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role full access to the bucket
CREATE POLICY "Service role can manage drive-pdf-cache"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'drive-pdf-cache')
WITH CHECK (bucket_id = 'drive-pdf-cache');
`);
}

setupPdfCacheBucket()
  .then(() => {
    console.log('Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
