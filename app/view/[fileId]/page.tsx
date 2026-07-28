import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccess } from '@/lib/permissions';
import { notFound } from 'next/navigation';
import DocumentViewer from '@/components/document-viewer';

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
  const session = await getServerSession(authOptions);
  const userGroupKeys = (session as any)?.userGroupKeys || [];
  const { fileId } = await params;
  const { resourceType = 'document_section', resourceId } = await searchParams;

  console.log('[ViewDocumentPage] Rendering', { fileId, resourceType, resourceId });

  if (!resourceId) {
    return notFound();
  }

  // Check permissions
  const hasAccess = await canAccess(userGroupKeys, resourceType, resourceId);
  if (!hasAccess) {
    return notFound();
  }

  console.log('[ViewDocumentPage] Access granted, rendering DocumentViewer');

  return (
    <DocumentViewer 
      fileId={fileId} 
      resourceType={resourceType} 
      resourceId={resourceId} 
    />
  );
}
