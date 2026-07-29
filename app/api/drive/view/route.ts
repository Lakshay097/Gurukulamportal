import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccess } from '@/lib/permissions';
import { getDriveClient, isConvertibleOfficeMimeType } from '@/lib/drive';
import { getCachedPdf } from '@/lib/pdf-cache';

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

    // For Office files (DOCX, XLSX, PPTX, DOC, XLS, PPT), serve cached PDF
    if (isConvertibleOfficeMimeType(mimeType)) {
      console.log('[Drive View API] Office file detected, checking cache');

      const pdfBuffer = await getCachedPdf(fileId, modifiedTime);
      if (!pdfBuffer) {
        console.error('[Drive View API] PDF not cached for file:', fileId);
        // Return HTML error instead of JSON so iframe can display it properly
        const htmlError = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Document Not Ready</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #f9fafb;
              }
              .error-container {
                text-align: center;
                padding: 2rem;
                max-width: 500px;
              }
              .error-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
              }
              h1 {
                color: #1f2937;
                margin-bottom: 0.5rem;
              }
              p {
                color: #6b7280;
                line-height: 1.5;
              }
              .button {
                display: inline-block;
                margin-top: 1.5rem;
                padding: 0.5rem 1rem;
                background: #3b82f6;
                color: white;
                text-decoration: none;
                border-radius: 0.375rem;
              }
            </style>
          </head>
          <body>
            <div class="error-container">
              <div class="error-icon">📄</div>
              <h1>Document Not Ready</h1>
              <p>This document is being prepared for viewing. Please try again in a few minutes or contact an administrator to pre-convert documents.</p>
              <a href="javascript:window.parent.postMessage({type:'close'}, '*')" class="button">Close</a>
            </div>
          </body>
          </html>
        `;
        return new NextResponse(htmlError, {
          status: 502,
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }

      const pdfFileName = fileName.replace(/\.\w+$/, '') + '.pdf';
      console.log('[Drive View API] Serving cached PDF:', pdfFileName);

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
