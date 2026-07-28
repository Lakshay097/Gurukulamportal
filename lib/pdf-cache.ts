import { adminDb } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

const CACHE_COLLECTION = 'drive_pdf_cache';
const PDF_CACHE_BUCKET = 'drive-pdf-cache';

function cacheDocId(fileId: string): string {
  // Firestore doc IDs can't contain '/', fileId shouldn't have one, but
  // sanitize defensively anyway.
  return fileId.replace(/[/\s]/g, '_');
}

interface CacheEntry {
  fileId: string;
  modifiedTime: string;
  storagePath: string;
  cachedAt: number;
}

/**
 * Returns cached PDF bytes if a cache entry exists AND its modifiedTime
 * matches the current file's modifiedTime (i.e. the source hasn't changed
 * since it was cached). Returns null on any cache miss or mismatch.
 */
export async function getCachedPdf(
  fileId: string,
  modifiedTime: string
): Promise<Buffer | null> {
  try {
    const db = adminDb;
    if (!db) {
      console.warn('Firebase Admin SDK not available, skipping cache read');
      return null;
    }

    const docRef = db.collection(CACHE_COLLECTION).doc(cacheDocId(fileId));
    const snap = await docRef.get();

    if (!snap.exists) return null;

    const entry = snap.data() as CacheEntry;
    if (entry.modifiedTime !== modifiedTime) {
      // Source file has changed since we cached it — treat as a miss.
      return null;
    }

    // Download from Supabase Storage
    const fileName = entry.storagePath;
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(PDF_CACHE_BUCKET)
      .download(fileName);

    if (downloadError) {
      console.warn(`Cache entry exists in Firestore but not Supabase Storage: ${fileName}`, downloadError);
      return null;
    }

    // Convert Blob to Buffer
    const arrayBuffer = await downloadData.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error('PDF cache read failed, falling back to live conversion:', err);
    return null; // Cache failures should never block serving the document.
  }
}

export async function setCachedPdf(
  fileId: string,
  modifiedTime: string,
  pdfBuffer: Buffer
): Promise<void> {
  try {
    const storagePath = `${cacheDocId(fileId)}.pdf`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(PDF_CACHE_BUCKET)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      throw uploadError;
    }

    const db = adminDb;
    if (!db) {
      console.warn('Firebase Admin SDK not available, skipping cache metadata write');
      return;
    }

    const entry: CacheEntry = {
      fileId,
      modifiedTime,
      storagePath,
      cachedAt: Date.now(),
    };
    await db.collection(CACHE_COLLECTION).doc(cacheDocId(fileId)).set(entry);
  } catch (err) {
    // Cache write failures must never break the response to the user —
    // the PDF was already generated and can still be served even if
    // caching it for next time fails.
    console.error('PDF cache write failed (non-fatal):', err);
  }
}

/**
 * Uploads a PDF buffer to the cache for webhook-based conversions.
 * This is used by the Gotenberg webhook handler when conversion completes.
 * Uses a default modifiedTime of "webhook" since webhook conversions are always fresh.
 */
export async function uploadToPdfCache(
  fileId: string,
  pdfBuffer: Buffer,
  modifiedTime: string = 'webhook'
): Promise<void> {
  try {
    const storagePath = `${cacheDocId(fileId)}.pdf`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(PDF_CACHE_BUCKET)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      throw uploadError;
    }

    const db = adminDb;
    if (!db) {
      console.warn('Firebase Admin SDK not available, skipping cache metadata write');
      return;
    }

    const entry: CacheEntry = {
      fileId,
      modifiedTime,
      storagePath,
      cachedAt: Date.now(),
    };
    await db.collection(CACHE_COLLECTION).doc(cacheDocId(fileId)).set(entry);
  } catch (err) {
    console.error('PDF cache upload failed:', err);
    throw err;
  }
}

/**
 * Marks a PDF conversion as failed in Firestore.
 * This allows the status endpoint to report failures to the client.
 */
export async function markConversionFailed(
  fileId: string,
  errorDetails: string
): Promise<void> {
  try {
    const db = adminDb;
    if (!db) {
      console.warn('Firebase Admin SDK not available, skipping failure record');
      return;
    }

    await db.collection(CACHE_COLLECTION).doc(cacheDocId(fileId)).set({
      fileId,
      modifiedTime: 'webhook',
      failed: true,
      errorDetails,
      cachedAt: Date.now(),
    });
  } catch (err) {
    console.error('Failed to record conversion error:', err);
  }
}

/**
 * Gets a public signed URL for a cached PDF if it exists.
 * Returns null if the PDF is not cached or failed.
 */
export async function getCachedPdfUrl(fileId: string): Promise<string | null> {
  try {
    const db = adminDb;
    if (!db) {
      console.warn('Firebase Admin SDK not available, cannot check cache status');
      return null;
    }

    const docRef = db.collection(CACHE_COLLECTION).doc(cacheDocId(fileId));
    const snap = await docRef.get();

    if (!snap.exists) {
      return null;
    }

    const entry = snap.data() as CacheEntry & { failed?: boolean; errorDetails?: string };
    
    // Check if conversion failed
    if (entry.failed) {
      return null;
    }

    // Generate signed URL from Supabase
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(PDF_CACHE_BUCKET)
      .createSignedUrl(entry.storagePath, 3600); // 1 hour expiry

    if (signedUrlError || !signedUrlData) {
      console.error('Error generating signed URL:', signedUrlError);
      return null;
    }

    return signedUrlData.signedUrl;
  } catch (err) {
    console.error('Error getting cached PDF URL:', err);
    return null;
  }
}
