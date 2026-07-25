import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb, useAdminSDK, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import AccessGate from '@/components/access-gate';
import DocumentRow from '@/components/document-row';
import EmptyState from '@/components/empty-state';
import { DOC_SECTION_TYPES, RESOURCE_TYPES } from '@/lib/constants';

interface DocumentSection {
  id: string;
  type: string;
  schoolId?: string;
  driveFolderId?: string;
  status: string;
}

async function getCbseRulesSections(): Promise<DocumentSection[]> {
  try {
    if (useAdminSDK && adminDb) {
      const snapshot = await adminDb
        .collection('documentSections')
        .where('type', '==', DOC_SECTION_TYPES.CBSE_RULES)
        .where('schoolId', '==', null)
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DocumentSection));
    } else {
      const sectionsRef = collection(db, 'documentSections');
      const q = query(
        sectionsRef,
        where('type', '==', DOC_SECTION_TYPES.CBSE_RULES),
        where('schoolId', '==', null)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DocumentSection));
    }
  } catch (error) {
    console.error('Error fetching CBSE rules sections:', error);
    return [];
  }
}

export default async function CbseRulesPage() {
  const session = await getServerSession(authOptions);
  const userGroupKeys = (session as any)?.userGroupKeys || [];

  const sections = await getCbseRulesSections();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CBSE Rules</h1>
          <p className="mt-2 text-gray-600">Central Board of Secondary Education rules and guidelines.</p>
        </div>

        <div className="space-y-6">
          {sections.length === 0 ? (
            <EmptyState variant="coming-soon" title="CBSE Rules coming soon" description="CBSE rules documents will be available here soon." />
          ) : (
            sections.map((section) => (
              <AccessGate
                key={section.id}
                resourceType={RESOURCE_TYPES.DOCUMENT_SECTION}
                resourceId={section.id}
                userGroupKeys={userGroupKeys}
              >
                <DocumentRow
                  title="CBSE Rules"
                  folderId={section.driveFolderId || null}
                  resourceType={RESOURCE_TYPES.DOCUMENT_SECTION}
                  resourceId={section.id}
                />
              </AccessGate>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
