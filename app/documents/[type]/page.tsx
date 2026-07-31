import { getAppSession } from '@/lib/session';
import { adminDb, useAdminSDK, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import AccessGate from '@/components/access-gate';
import DocumentRow from '@/components/document-row';
import EmptyState from '@/components/empty-state';
import { DOC_SECTION_TYPES, RESOURCE_TYPES } from '@/lib/constants';
import { DOCUMENT_TYPE_LABELS } from '@/lib/constants';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

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

function normalizeType(typeParam: string): string {
  const typeMap: Record<string, string> = {
    'sop': DOC_SECTION_TYPES.SOP,
    'draft': DOC_SECTION_TYPES.DRAFT,
    'duediligence': DOC_SECTION_TYPES.DUE_DILIGENCE,
    'agreement': DOC_SECTION_TYPES.AGREEMENT,
    'loi': DOC_SECTION_TYPES.LOI,
    'schooloption': DOC_SECTION_TYPES.SCHOOL_OPTION,
    'kra_kpi': DOC_SECTION_TYPES.KRA_KPI,
    'training_module': DOC_SECTION_TYPES.TRAINING_MODULE,
    'academic_policy': DOC_SECTION_TYPES.ACADEMIC_POLICY,
  };
  const normalized = typeMap[typeParam.toLowerCase()];
  return normalized || typeParam;
}

export default async function DocumentTypePage({ params }: { params: Promise<{ type: string }> }) {
  const session = await getAppSession();
  const userGroupKeys = session.groupKeys;
  const { type } = await params;
  
  const normalizedType = normalizeType(type);
  const validTypes = Object.values(DOC_SECTION_TYPES);

  if (!validTypes.includes(normalizedType as any)) {
    notFound();
  }
  
  console.log('[DocumentTypePage] Session:', session.userEmail);
  console.log('[DocumentTypePage] User group keys:', userGroupKeys);
  console.log('[DocumentTypePage] Type:', type);
  console.log('[DocumentTypePage] Normalized type:', normalizedType);
  
  const sections = await getDocumentSections();
  console.log('[DocumentTypePage] Found sections:', sections.length);

  // Find the section matching the normalized type
  const section = sections.find(s => s.type.toLowerCase() === normalizedType.toLowerCase());
  
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
