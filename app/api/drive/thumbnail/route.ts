import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/session';
import { canAccess } from '@/lib/permissions';
import { getDriveClient } from '@/lib/drive';
import { getCachedThumbnailUrl, cacheThumbnail } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const session = await getAppSession();
    const userGroupKeys = session.groupKeys;

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

    // Check cache first
    const cachedUrl = await getCachedThumbnailUrl(fileId);
    if (cachedUrl) {
      return NextResponse.redirect(cachedUrl);
    }

    // Use service account to fetch thumbnail with authentication
    const drive = getDriveClient();
    
    // Get file metadata to check if it's a Google Docs file
    const file = await drive.files.get({
      fileId,
      fields: 'mimeType,thumbnailLink',
    });

    // For Google Docs files, we can't get thumbnails via API, return 404
    if (file.data.mimeType?.startsWith('application/vnd.google-apps')) {
      return NextResponse.json({ error: 'No thumbnail available for Google Docs files' }, { status: 404 });
    }

    const thumbnailLink = file.data.thumbnailLink;
    if (!thumbnailLink) {
      return NextResponse.json({ error: 'No thumbnail available' }, { status: 404 });
    }

    // Fetch the thumbnail image using service account authentication
    // We need to use the Drive API with alt=media to get authenticated access
    try {
      const response = await drive.files.get({
        fileId,
        alt: 'media',
      }, { responseType: 'arraybuffer' });

      const imageBuffer = Buffer.from(response.data as ArrayBuffer);
      
      // Cache the thumbnail for future requests
      cacheThumbnail(fileId, thumbnailLink).catch(() => {});
      
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': file.data.mimeType || 'image/jpeg',
          'Cache-Control': 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (error) {
      console.error('Error fetching file content for thumbnail:', error);
      // Fallback: try to fetch the thumbnail link directly
      const thumbnailResponse = await fetch(thumbnailLink);
      if (thumbnailResponse.ok) {
        const imageBuffer = await thumbnailResponse.arrayBuffer();
        
        // Cache the thumbnail for future requests
        cacheThumbnail(fileId, thumbnailLink).catch(() => {});
        
        return new NextResponse(Buffer.from(imageBuffer), {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=3600',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    return NextResponse.json({ error: 'Failed to fetch thumbnail' }, { status: 500 });
  }
}
