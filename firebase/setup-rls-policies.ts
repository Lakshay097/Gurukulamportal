import { createClient } from '@supabase/supabase-js';

// Use provided Supabase credentials
const supabaseUrl = 'https://grcwwrpkjnosokoazmpq.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyY3d3cnBram5vc29rb2F6bXBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg4NTU5OCwiZXhwIjoyMTAwNDYxNTk4fQ.kBpcqKxb4k_WWmpyJPT3Fs32R2CMlE8YKEqRVZcUmBw';

/**
 * Script to set up RLS policies for the drive-pdf-cache bucket
 * This uses the Supabase REST API to execute SQL
 */
async function setupRlsPolicies() {
  console.log('Setting up RLS policies for drive-pdf-cache bucket...');

  const sqlStatements = [
    // Enable RLS on storage.objects
    `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`,
    
    // Drop existing policy if it exists (to avoid conflicts)
    `DROP POLICY IF EXISTS "Service role can manage drive-pdf-cache" ON storage.objects;`,
    
    // Create policy for service role
    `CREATE POLICY "Service role can manage drive-pdf-cache"
     ON storage.objects
     FOR ALL
     TO service_role
     USING (bucket_id = 'drive-pdf-cache')
     WITH CHECK (bucket_id = 'drive-pdf-cache');`
  ];

  for (const sql of sqlStatements) {
    console.log(`Executing: ${sql.substring(0, 60)}...`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Error executing SQL:`, error);
      
      // Some statements might fail if they already exist, which is okay
      if (!error.includes('already exists') && !error.includes('does not exist')) {
        console.error('Non-fatal error, continuing...');
      }
    } else {
      console.log('✓ Success');
    }
  }

  console.log('\nRLS policies setup complete!');
  console.log('The drive-pdf-cache bucket is now ready for PDF caching.');
}

setupRlsPolicies()
  .then(() => {
    console.log('Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    console.log('\nPlease run the following SQL manually in Supabase SQL Editor:');
    console.log(`
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can manage drive-pdf-cache" ON storage.objects;

-- Create policy for service role
CREATE POLICY "Service role can manage drive-pdf-cache"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'drive-pdf-cache')
WITH CHECK (bucket_id = 'drive-pdf-cache');
`);
    process.exit(1);
  });
