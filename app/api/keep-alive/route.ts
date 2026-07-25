import { NextResponse } from 'next/server';
import { supabase, THUMBNAIL_BUCKET } from '@/lib/supabase';

const KEEP_ALIVE_SECRET = process.env.SUPABASE_KEEP_ALIVE_SECRET;

/**
 * Keep-alive endpoint to prevent Supabase free-tier project from pausing.
 * 
 * Supabase free-tier projects pause after 7 days with no API request.
 * This endpoint performs a lightweight Supabase Storage API call (list files in thumbnail bucket)
 * to keep the project active. Scheduled to run daily via GitHub Actions.
 * 
 * Requires SUPABASE_KEEP_ALIVE_SECRET for authentication to prevent abuse.
 */
export async function GET(request: Request) {
  // Verify authentication
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
  }

  const providedSecret = authHeader.substring(7);
  if (providedSecret !== KEEP_ALIVE_SECRET) {
    return NextResponse.json({ error: 'Invalid authorization' }, { status: 403 });
  }

  try {
    // Perform a lightweight Supabase API call to keep the project active
    // List files in the thumbnail bucket (minimal bandwidth/cost)
    const { data, error } = await supabase.storage
      .from(THUMBNAIL_BUCKET)
      .list('', {
        limit: 1, // Only fetch 1 file to minimize bandwidth
      });

    if (error) {
      console.error('Supabase keep-alive failed:', error);
      return NextResponse.json(
        { error: 'Supabase API call failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Keep-alive ping successful',
      timestamp: new Date().toISOString(),
      bucketFilesCount: data?.length || 0,
    });
  } catch (error) {
    console.error('Keep-alive endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
