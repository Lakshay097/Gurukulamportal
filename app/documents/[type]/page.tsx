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

export default async function DocumentTypePage({ params }: { params: Promise<{ type: string }> }) {
  const session = await getServerSession(authOptions);
  const userGroupKeys = (session as any)?.userGroupKeys || [];
  const { type } = await params;
  
  console.log('[DocumentTypePage] Session:', session?.user?.email);
  console.log('[DocumentTypePage] User group keys:', userGroupKeys);
  console.log('[DocumentTypePage] Type:', type);
  
  const sections = await getDocumentSections();
  console.log('[DocumentTypePage] Found sections:', sections.length);

  // Find the section matching the type
  const section = sections.find(s => s.type.toLowerCase() === type.toLowerCase());
  
  if (!section || !section.driveFolderId) {
    return (
      <main style={{ backgroundColor: 'var(--parchment)' }}>
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
          <Link href="/documents" className="inline-flex items-center text-sm mb-6" style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-work-sans)' }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Link>
          <EmptyState variant="error" title="Folder not found" description="The requested document folder could not be found." />
        </div>
      </main>
    );
  }

  const documentType = type.toLowerCase();
  const title = DOCUMENT_TYPE_LABELS[section.type] || section.type;

  return (
    <main style={{ backgroundColor: 'var(--parchment)' }}>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <Link href="/documents" className="inline-flex items-center text-sm mb-6" style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-work-sans)' }}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Link>
        
        <div className="mb-8 pt-8">
          <h1 style={{ 
            fontFamily: 'var(--font-alegreya)', 
            fontWeight: 700,
            fontSize: 'clamp(1.9rem, 3.4vw, 2.7rem)',
            color: 'var(--ink)'
          }}>
            {title}
          </h1>
          <p style={{ 
            fontFamily: 'var(--font-work-sans)', 
            color: 'var(--ink-soft)',
            fontSize: '1rem',
            marginTop: '0.5rem'
          }}>
            Browse and access documents in this folder.
          </p>
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
    </main>
  );
}
