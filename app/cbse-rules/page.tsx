import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb, useAdminSDK, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import AccessGate from '@/components/access-gate';
import DocumentRow from '@/components/document-row';
import EmptyState from '@/components/empty-state';
import { IconSprite } from '@/components/icon-sprite';
import DocumentsContent from '@/components/documents-content';
import { DOC_SECTION_TYPES, RESOURCE_TYPES } from '@/lib/constants';

interface DocumentSection {
  id: string;
  type: string;
  schoolId?: string;
  driveFolderId?: string;
  status: string;
}

async function getCBSEDocumentSections(): Promise<DocumentSection[]> {
  try {
    if (useAdminSDK && adminDb) {
      const snapshot = await adminDb
        .collection('documentSections')
        .where('type', '==', 'CBSE_RULES')
        .where('schoolId', '==', null)
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DocumentSection));
    } else {
      const sectionsRef = collection(db, 'documentSections');
      const q = query(
        sectionsRef,
        where('type', '==', 'CBSE_RULES'),
        where('schoolId', '==', null)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DocumentSection));
    }
  } catch (error) {
    console.error('Error fetching CBSE document sections:', error);
    return [];
  }
}

export default async function CbseRulesPage() {
  const session = await getServerSession(authOptions);
  const userGroupKeys = (session as any)?.userGroupKeys || [];
  
  const sections = await getCBSEDocumentSections();

  // Filter to only show sections with driveFolderId
  const sectionsWithFolders = sections.filter(section => section.driveFolderId);

  return (
    <main style={{ backgroundColor: 'var(--parchment)' }}>
      <IconSprite />
      <DocumentsContent>
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
          <div className="mb-12 pt-8 reveal" style={{ paddingBottom: '100px' }}>
            <div className="eyebrow mb-4">COMPLIANCE / CBSE</div>
            <h1 className="mb-3" style={{ 
              fontFamily: 'var(--font-alegreya)', 
              fontWeight: 700,
              fontSize: 'clamp(1.9rem, 3.4vw, 2.7rem)',
              color: 'var(--ink)'
            }}>
              CBSE Rules & Compliance
            </h1>
            <p className="max-w-2xl" style={{ 
              fontFamily: 'var(--font-work-sans)', 
              color: 'var(--ink-soft)',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              Central Board of Secondary Education regulations, compliance guidelines, and educational standards for our schools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 reveal">
            {sectionsWithFolders.length === 0 ? (
              <div className="col-span-full">
                <EmptyState variant="coming-soon" title="CBSE Rules coming soon" description="CBSE compliance documents will be available here soon once they are configured in Google Drive." />
              </div>
            ) : (
              sectionsWithFolders.map((section) => (
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
                    documentType="cbse-rules"
                  />
                </AccessGate>
              ))
            )}
          </div>
        </div>
      </DocumentsContent>
    </main>
  );
}
