import { NextRequest, NextResponse } from 'next/server';
import { getCachedPdfUrl } from '@/lib/pdf-cache';
import { adminDb } from '@/lib/firebase';

const CACHE_COLLECTION = 'drive_pdf_cache';

function cacheDocId(fileId: string): string {
  return fileId.replace(/[/\s]/g, '_');
}

/**
 * Status endpoint for async PDF conversions.
 * Clients poll this endpoint to check if a conversion is complete.
 * Returns:
 * - { status: 'processing' } if conversion is still in progress
 * - { status: 'ready', url } if conversion succeeded with signed URL
 * - { status: 'failed', error } if conversion failed
 */
export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('fileId');
  
  if (!fileId) {
    return new NextResponse('fileId required', { status: 400 });
  }

  try {
    // First check if we have a cached PDF ready
    const url = await getCachedPdfUrl(fileId);
    if (url) {
      return NextResponse.json({ status: 'ready', url });
    }

    // Check if there's a failure record
    const db = adminDb;
    if (db) {
      const docRef = db.collection(CACHE_COLLECTION).doc(cacheDocId(fileId));
      const snap = await docRef.get();
      
      if (snap.exists) {
        const entry = snap.data() as { failed?: boolean; errorDetails?: string };
        
        if (entry.failed) {
          return NextResponse.json({ 
            status: 'failed', 
            error: entry.errorDetails || 'Conversion failed' 
          });
        }
      }
    }

    // Still processing
    return NextResponse.json({ status: 'processing' });
  } catch (err) {
    console.error('[PDF Status] Error checking status:', err);
    return new NextResponse('internal error', { status: 500 });
  }
}
