import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb, useAdminSDK, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import AccessGate from '@/components/access-gate';
import DocumentRow from '@/components/document-row';
import EmptyState from '@/components/empty-state';
import { DOC_SECTION_TYPES, RESOURCE_TYPES } from '@/lib/constants';
import { DOCUMENT_TYPE_LABELS } from '@/lib/constants';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface DocumentSection {
  id: string;
  type: string;
  schoolId?: string;
  driveFolderId?: string;
  status: string;
}

async function getDocumentSections(): Promise<DocumentSection[]> {
  try {
    if (useAdminSDK && adminDb) {
      const snapshot = await adminDb
        .collection('documentSections')
        .where('schoolId', '==', null)
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DocumentSection));
    } else {
      const sectionsRef = collection(db, 'documentSections');
      const q = query(sectionsRef, where('schoolId', '==', null));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DocumentSection));
    }
  } catch (error) {
    console.error('Error fetching document sections:', error);
    return [];
  }
}

export default async function DocumentPathPage({ params }: { params: Promise<{ path: string[] }> }) {
  const session = await getServerSession(authOptions);
  const userGroupKeys = (session as any)?.userGroupKeys || [];
  const { path } = await params;
  
  console.log('[DocumentPathPage] Session:', session?.user?.email);
  console.log('[DocumentPathPage] User group keys:', userGroupKeys);
  console.log('[DocumentPathPage] Path:', path);
  
  // The first segment should be the document type (e.g., 'sop', 'draft')
  if (!path || path.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/documents" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Link>
          <EmptyState variant="error" title="Invalid path" description="No document type specified." />
        </div>
      </div>
    );
  }

  const type = path[0];
  const sections = await getDocumentSections();
  console.log('[DocumentPathPage] Found sections:', sections.length);

  // Find the section matching the type
  const section = sections.find(s => s.type.toLowerCase() === type.toLowerCase());
  
  if (!section || !section.driveFolderId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/documents" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Link>
          <EmptyState variant="error" title="Folder not found" description="The requested document folder could not be found." />
        </div>
      </div>
    );
  }

  const documentType = type.toLowerCase();
  const title = DOCUMENT_TYPE_LABELS[section.type] || section.type;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/documents" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-600">Browse and access documents in this folder.</p>
        </div>

        <AccessGate
          resourceType={RESOURCE_TYPES.DOCUMENT_SECTION}
          resourceId={section.id}
          userGroupKeys={userGroupKeys}
        >
          <DocumentRow
            folderId={section.driveFolderId || null}
            resourceType={RESOURCE_TYPES.DOCUMENT_SECTION}
            resourceId={section.id}
            documentType={documentType}
            showFiles={true}
          />
        </AccessGate>
      </div>
    </div>
  );
}
