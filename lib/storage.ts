import admin from 'firebase-admin';
import { supabase, THUMBNAIL_BUCKET } from './supabase';

const THUMBNAIL_CACHE_COLLECTION = 'thumbnail_cache';

/**
 * Download an image from a URL and upload it to Supabase Storage
 * Returns the public CDN URL of the uploaded image
 */
export async function cacheThumbnail(fileId: string, imageUrl: string): Promise<string | null> {
  try {
    // Download the image from Drive
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to download thumbnail from Drive: ${response.statusText}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Upload to Supabase Storage
    const fileName = `${fileId}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(THUMBNAIL_BUCKET)
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error(`Error uploading to Supabase Storage:`, uploadError);
      return null;
    }

    // Get the public URL (using CDN for bandwidth efficiency)
    const { data: urlData } = supabase.storage
      .from(THUMBNAIL_BUCKET)
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Cache the URL in Firestore
    const db = admin.firestore();
    await db.collection(THUMBNAIL_CACHE_COLLECTION).doc(fileId).set({
      url: publicUrl,
      cachedAt: admin.firestore.FieldValue.serverTimestamp(),
      driveFileId: fileId,
      isSupabaseUrl: true, // Flag to indicate this is a Supabase Storage URL
    });

    return publicUrl;
  } catch (error) {
    console.error(`Error caching thumbnail for file ${fileId}:`, error);
    return null;
  }
}

/**
 * Get cached thumbnail URL from Firestore
 */
export async function getCachedThumbnailUrl(fileId: string): Promise<string | null> {
  try {
    const db = admin.firestore();
    const doc = await db.collection(THUMBNAIL_CACHE_COLLECTION).doc(fileId).get();

    if (doc.exists) {
      const data = doc.data();
      return data?.url || null;
    }

    return null;
  } catch (error) {
    console.error(`Error getting cached thumbnail for file ${fileId}:`, error);
    return null;
  }
}

/**
 * Delete a cached thumbnail from Supabase Storage and Firestore
 */
export async function deleteCachedThumbnail(fileId: string): Promise<void> {
  try {
    // Delete from Supabase Storage
    const fileName = `${fileId}.jpg`;
    const { error: deleteError } = await supabase.storage
      .from(THUMBNAIL_BUCKET)
      .remove([fileName]);

    if (deleteError) {
      console.error(`Error deleting from Supabase Storage:`, deleteError);
    }

    // Delete from Firestore
    const db = admin.firestore();
    await db.collection(THUMBNAIL_CACHE_COLLECTION).doc(fileId).delete();
  } catch (error) {
    console.error(`Error deleting cached thumbnail for file ${fileId}:`, error);
  }
}
