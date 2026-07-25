import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccess } from '@/lib/permissions';
import { getThumbnailUrl } from '@/lib/drive';
import { getCachedThumbnailUrl, cacheThumbnail } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userGroupKeys = (session as any)?.userGroupKeys || [];

    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');
    const resourceType = searchParams.get('resourceType') || 'document_section';
    const resourceId = searchParams.get('resourceId');

    if (!fileId || !resourceId) {
      return NextResponse.json({ error: 'fileId and resourceId are required' }, { status: 400 });
    }

    const hasAccess = await canAccess(userGroupKeys, resourceType, resourceId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if we have a cached thumbnail in Supabase Storage
    const cachedUrl = await getCachedThumbnailUrl(fileId);
    if (cachedUrl) {
      return NextResponse.redirect(cachedUrl);
    }

    // No cached thumbnail - fetch from Drive and cache it
    const driveThumbnailUrl = await getThumbnailUrl(fileId);
    if (driveThumbnailUrl) {
      // Download and cache the thumbnail in Supabase Storage
      const cachedSupabaseUrl = await cacheThumbnail(fileId, driveThumbnailUrl);
      if (cachedSupabaseUrl) {
        return NextResponse.redirect(cachedSupabaseUrl);
      }
      // Fallback to Drive URL if caching fails
      return NextResponse.redirect(driveThumbnailUrl);
    }

    // No thumbnail available - return 404 so the component shows fallback icon
    return NextResponse.json({ error: 'No thumbnail available' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    return NextResponse.json({ error: 'Failed to fetch thumbnail' }, { status: 500 });
  }
}
