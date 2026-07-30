import { getAppSession } from '@/lib/session';
import { canAccess } from '@/lib/permissions';
import { notFound } from 'next/navigation';
import DocumentViewer from '@/components/document-viewer';
import DocumentViewerError from '@/components/document-viewer-error';
import { getDriveClient, isConvertibleOfficeMimeType } from '@/lib/drive';
import { getCachedPdf } from '@/lib/pdf-cache';

interface PageProps {
  params: Promise<{
    fileId: string;
  }>;
  searchParams: Promise<{
    resourceType?: string;
    resourceId?: string;
  }>;
}

export default async function ViewDocumentPage({ params, searchParams }: PageProps) {
  const session = await getAppSession();
  const userGroupKeys = session.groupKeys;
  const { fileId } = await params;
  const { resourceType = 'document_section', resourceId } = await searchParams;

  console.log('[ViewDocumentPage] Rendering', { fileId, resourceType, resourceId });

  if (!resourceId) {
    return notFound();
  }

  // Check permissions
  const hasAccess = await canAccess(userGroupKeys, resourceType, resourceId);
  if (!hasAccess) {
    console.log('[ViewDocumentPage] Access denied');
    return (
      <DocumentViewerError 
        error="You do not have permission to view this document." 
      />
    );
  }

  console.log('[ViewDocumentPage] Access granted, fetching file metadata');

  // Fetch file metadata (cheap, no download/conversion)
  let fileName = '';
  let mimeType = '';
  let modifiedTime = '';

  try {
    const drive = getDriveClient();
    const file = await drive.files.get({
      fileId,
      fields: 'mimeType,name,modifiedTime',
    });

    fileName = file.data.name || 'file';
    mimeType = file.data.mimeType || 'application/octet-stream';
    modifiedTime = file.data.modifiedTime || 'unknown';

    console.log('[ViewDocumentPage] File metadata:', { fileName, mimeType, fileId });

    // For Office files, check if PDF is cached
    if (isConvertibleOfficeMimeType(mimeType)) {
      console.log('[ViewDocumentPage] Office file detected, checking cache');
      const cachedPdf = await getCachedPdf(fileId, modifiedTime);
      if (!cachedPdf) {
        console.log('[ViewDocumentPage] PDF not cached, showing error');
        return (
          <DocumentViewerError 
            error="This document is being prepared for viewing. Please try again in a few minutes or contact an administrator to pre-convert documents." 
          />
        );
      }
      console.log('[ViewDocumentPage] PDF cache hit');
    }
  } catch (error: any) {
    console.error('[ViewDocumentPage] Error fetching file metadata:', error);
    return (
      <DocumentViewerError 
        error={`Failed to load document: ${error.message || 'File not found or inaccessible'}`} 
      />
    );
  }

  console.log('[ViewDocumentPage] Rendering DocumentViewer with metadata');

  return (
    <DocumentViewer 
      fileId={fileId} 
      resourceType={resourceType} 
      resourceId={resourceId}
      fileName={fileName}
      mimeType={mimeType}
    />
  );
}
