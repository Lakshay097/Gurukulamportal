import { getAppSession } from '@/lib/session';
import { adminDb, useAdminSDK, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import AccessGate from '@/components/access-gate';
import DocumentRow from '@/components/document-row';
import EmptyState from '@/components/empty-state';
import { IconSprite } from '@/components/icon-sprite';
import DocumentsContent from '@/components/documents-content';
import { DOC_SECTION_TYPES, RESOURCE_TYPES } from '@/lib/constants';
import { DOCUMENT_TYPE_LABELS } from '@/lib/constants';

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

export default async function DocumentsPage() {
  const session = await getAppSession();
  const userGroupKeys = session.groupKeys;
  
  console.log('[DocumentsPage] Session:', session.userEmail);
  console.log('[DocumentsPage] User group keys:', userGroupKeys);
  
  const sections = await getDocumentSections();
  console.log('[DocumentsPage] Found sections:', sections.length);
  console.log('[DocumentsPage] Sections:', JSON.stringify(sections, null, 2));

  // Filter to only show sections with driveFolderId
  const sectionsWithFolders = sections.filter(section => section.driveFolderId);
  console.log('[DocumentsPage] Sections with folders:', sectionsWithFolders.length);

  // Group sections by type
  const sectionsByType = sectionsWithFolders.reduce((acc, section) => {
    if (!acc[section.type]) {
      acc[section.type] = [];
    }
    acc[section.type].push(section);
    return acc;
  }, {} as Record<string, DocumentSection[]>);

  return (
    <main style={{ backgroundColor: 'var(--parchment)' }}>
      <IconSprite />
      <DocumentsContent>
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
          <div className="mb-12 pt-8 reveal" style={{ paddingBottom: '100px' }}>
            <div className="eyebrow mb-4">PORTAL / CENTRAL LIBRARY</div>
            <h1 className="mb-3" style={{ 
              fontFamily: 'var(--font-alegreya)', 
              fontWeight: 700,
              fontSize: 'clamp(1.9rem, 3.4vw, 2.7rem)',
              color: 'var(--ink)'
            }}>
              Documents
            </h1>
            <p className="max-w-2xl" style={{ 
              fontFamily: 'var(--font-work-sans)', 
              color: 'var(--ink-soft)',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              Browse and access central documents across all branches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 reveal">
            {sectionsWithFolders.length === 0 ? (
              <div className="col-span-full">
                <EmptyState variant="coming-soon" title="Documents coming soon" description="Document folders will be available here soon once they are configured in Google Drive." />
              </div>
            ) : (
              Object.entries(sectionsByType).map(([type, typeSections]) => (
                typeSections.map((section) => (
                  <AccessGate
                    key={section.id}
                    resourceType={RESOURCE_TYPES.DOCUMENT_SECTION}
                    resourceId={section.id}
                    userGroupKeys={userGroupKeys}
                  >
                    <DocumentRow
                      folderId={section.driveFolderId || null}
                      resourceType={RESOURCE_TYPES.DOCUMENT_SECTION}
                      resourceId={section.id}
                      documentType={type.toLowerCase()}
                    />
                  </AccessGate>
                ))
              ))
            )}
          </div>
        </div>
      </DocumentsContent>
    </main>
  );
}
