import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccess } from '@/lib/permissions';
import { getDriveClient, downloadFileBytes, isConvertibleOfficeMimeType } from '@/lib/drive';
import { convertOfficeBufferToPdf } from '@/lib/gotenberg';
import { getCachedPdf, setCachedPdf } from '@/lib/pdf-cache';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userGroupKeys = (session as any)?.userGroupKeys || [];

    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');
    const resourceType = searchParams.get('resourceType') || 'document_section';
    const resourceId = searchParams.get('resourceId');

    console.log('[Drive View API] Request:', { fileId, resourceType, resourceId });

    if (!fileId || !resourceId) {
      return NextResponse.json({ error: 'fileId and resourceId are required' }, { status: 400 });
    }

    // Check permissions
    const hasAccess = await canAccess(userGroupKeys, resourceType, resourceId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Use service account to get file metadata (include modifiedTime for cache invalidation)
    const drive = getDriveClient();
    const file = await drive.files.get({
      fileId,
      fields: 'mimeType,name,modifiedTime',
    });

    const fileName = file.data.name || 'file';
    const mimeType = file.data.mimeType || 'application/octet-stream';
    const modifiedTime = file.data.modifiedTime || 'unknown';

    console.log('[Drive View API] File:', { fileName, mimeType, fileId });
    console.log('[Drive View API] Is Google Docs?', mimeType.startsWith('application/vnd.google-apps'));
    console.log('[Drive View API] Is convertible Office?', isConvertibleOfficeMimeType(mimeType));

    // If it's a Google Docs/Sheets/Slides file, we need to export it
    if (mimeType.startsWith('application/vnd.google-apps')) {
      const mimeTypeMap: Record<string, string> = {
        'application/vnd.google-apps.document': 'application/pdf',
        'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.google-apps.presentation': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      };

      const exportMimeType = mimeTypeMap[mimeType] || 'application/pdf';
      const extension = exportMimeType === 'application/pdf' ? 'pdf' : 
                       exportMimeType.includes('spreadsheet') ? 'xlsx' : 'pptx';
      
      console.log('[Drive View API] Exporting as:', exportMimeType);
      
      const response = await drive.files.export({
        fileId,
        mimeType: exportMimeType,
      });

      console.log('[Drive View API] Exported data length:', response.data?.length || 0);

      // Return the file content with view-only restrictions
      return new NextResponse(response.data, {
        headers: {
          'Content-Type': exportMimeType,
          'Content-Disposition': `inline; filename="${fileName}.${extension}"`,
          'Cache-Control': 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
        },
      });
    }

    // For Office files (DOCX, XLSX, PPTX, DOC, XLS, PPT), convert to PDF using Gotenberg
    // and serve through our own proxy — never expose a drive.google.com URL to the client.
    if (isConvertibleOfficeMimeType(mimeType)) {
      console.log('[Drive View API] Office file detected, converting to PDF');

      let pdfBuffer = await getCachedPdf(fileId, modifiedTime);

      if (!pdfBuffer) {
        console.log('[Drive View API] Cache miss, performing live conversion');
        try {
          console.log('[Drive View API] Step 1: Downloading file bytes from Drive');
          const rawBytes = await downloadFileBytes(fileId, drive);
          console.log('[Drive View API] Step 1 complete: Downloaded', rawBytes.length, 'bytes');
          
          console.log('[Drive View API] Step 2: Converting to PDF via LibreOffice');
          pdfBuffer = await convertOfficeBufferToPdf(rawBytes, fileName);
          console.log('[Drive View API] Step 2 complete: Conversion successful, PDF length:', pdfBuffer.length);
          
          // Fire-and-forget cache write — don't block the response on it.
          setCachedPdf(fileId, modifiedTime, pdfBuffer).catch(() => {});
        } catch (err) {
          console.error('Office file conversion failed', {
            fileId,
            mimeType,
            error: err instanceof Error ? err.message : err,
            stack: err instanceof Error ? err.stack : undefined,
          });

          return NextResponse.json(
            {
              error: 'preview_unavailable',
              message: 'This document could not be converted for preview. Please try again shortly.',
            },
            { status: 502 }
          );
        }
      } else {
        console.log('[Drive View API] Cache hit, serving cached PDF');
      }

      const pdfFileName = fileName.replace(/\.\w+$/, '') + '.pdf';

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${pdfFileName}"`,
          'Cache-Control': 'private, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
        },
      });
    }

    // For other files (PDFs, images, etc.), download and serve the content directly
    console.log('[Drive View API] Downloading file content');
    const response = await drive.files.get({
      fileId,
      alt: 'media',
    }, { responseType: 'arraybuffer' });

    const buffer = Buffer.from(response.data as ArrayBuffer);
    console.log('[Drive View API] Downloaded buffer length:', buffer.length);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  } catch (error: any) {
    console.error('[Drive View API] Error:', error);
    return NextResponse.json({ error: 'Failed to view file: ' + error.message }, { status: 500 });
  }
}
