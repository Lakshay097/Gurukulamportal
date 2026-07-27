import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb, useAdminSDK, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import AccessGate from '@/components/access-gate';
import DocumentRow from '@/components/document-row';
import EmptyState from '@/components/empty-state';
import { DOC_SECTION_TYPES, RESOURCE_TYPES } from '@/lib/constants';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { getFolderStructure, DriveFolder, DriveFile } from '@/lib/drive';
import { extractIdFromSlug, generateSlug } from '@/lib/slug-utils';
import DocumentCard from '@/components/document-card';
import DocumentsContent from '@/components/documents-content';
import { IconSprite } from '@/components/icon-sprite';

interface DocumentSection {
  id: string;
  type: string;
  schoolId?: string;
  driveFolderId?: string;
  status: string;
}

async function getDocumentSectionsByType(type: string): Promise<DocumentSection[]> {
  try {
    if (useAdminSDK && adminDb) {
      const snapshot = await adminDb
        .collection('documentSections')
        .where('type', '==', type)
        .where('schoolId', '==', null)
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DocumentSection));
    } else {
      const sectionsRef = collection(db, 'documentSections');
      const q = query(
        sectionsRef,
        where('type', '==', type),
        where('schoolId', '==', null)
      );
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
  };
  const normalized = typeMap[typeParam.toLowerCase()];
  return normalized || typeParam;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  [DOC_SECTION_TYPES.SOP]: 'Standard Operating Procedures',
  [DOC_SECTION_TYPES.DRAFT]: 'Draft Documents',
  [DOC_SECTION_TYPES.DUE_DILIGENCE]: 'Due Diligence Reports',
  [DOC_SECTION_TYPES.AGREEMENT]: 'Agreements',
  [DOC_SECTION_TYPES.LOI]: 'Letters of Intent',
  [DOC_SECTION_TYPES.SCHOOL_OPTION]: 'School Options',
  [DOC_SECTION_TYPES.KRA_KPI]: 'KRA & KPIs',
  [DOC_SECTION_TYPES.TRAINING_MODULE]: 'Training Module',
};


// Helper function to find a folder by ID in the folder structure
function findFolderById(folder: DriveFolder, folderId: string): DriveFolder | null {
  if (folder.id === folderId) {
    return folder;
  }
  for (const subfolder of folder.subfolders) {
    const found = findFolderById(subfolder, folderId);
    if (found) return found;
  }
  return null;
}

// Helper function to build breadcrumb path of folder names and slugs
function buildBreadcrumbPath(folder: DriveFolder, targetFolderId: string, pathNames: string[] = [], pathSlugs: string[] = []): { names: string[], slugs: string[] } | null {
  if (folder.id === targetFolderId) {
    return { names: [...pathNames, folder.name], slugs: [...pathSlugs, createSlugWithId(folder.name, folder.id)] };
  }
  for (const subfolder of folder.subfolders) {
    const result = buildBreadcrumbPath(subfolder, targetFolderId, [...pathNames, folder.name], [...pathSlugs, createSlugWithId(folder.name, folder.id)]);
    if (result) return result;
  }
  return null;
}

// Helper function to create slug with ID (inline since we can't import from drive.ts in server component)
function createSlugWithId(name: string, id: string): string {
  const slug = generateSlug(name);
  return `${slug}-${id}`;
}

export default async function DocumentTypePathPage({ 
  params 
}: { 
  params: Promise<{ type: string; path: string[] }> 
}) {
  const { type: typeParam, path } = await params;
  const session = await getServerSession(authOptions);
  const userGroupKeys = (session as any)?.userGroupKeys || [];

  const normalizedType = normalizeType(typeParam);
  const validTypes = Object.values(DOC_SECTION_TYPES);

  if (!validTypes.includes(normalizedType as any)) {
    notFound();
  }

  const sections = await getDocumentSectionsByType(normalizedType);
  const label = DOCUMENT_TYPE_LABELS[normalizedType] || normalizedType;

  // If no path, redirect to the type page
  if (!path || path.length === 0) {
    return (
      <main style={{ backgroundColor: 'var(--parchment)' }}>
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 pt-8">
            <h1 style={{ 
              fontFamily: 'var(--font-alegreya)', 
              fontWeight: 700,
              fontSize: 'clamp(1.9rem, 3.4vw, 2.7rem)',
              color: 'var(--ink)'
            }}>
              {label}
            </h1>
            <p style={{ 
              fontFamily: 'var(--font-work-sans)', 
              color: 'var(--ink-soft)',
              fontSize: '1rem',
              marginTop: '0.5rem'
            }}>
              Central documents accessible across all branches.
            </p>
          </div>

          <div className="space-y-6">
            {sections.length === 0 ? (
              <EmptyState variant="coming-soon" title={`${label} coming soon`} description="Documents will be available here soon." />
            ) : (
              sections.map((section) => (
                <AccessGate
                  key={section.id}
                  resourceType={RESOURCE_TYPES.DOCUMENT_SECTION}
                  resourceId={section.id}
                  userGroupKeys={userGroupKeys}
                >
                  <DocumentRow
                    title={label}
                    folderId={section.driveFolderId || null}
                    resourceType={RESOURCE_TYPES.DOCUMENT_SECTION}
                    resourceId={section.id}
                    documentType={typeParam}
                  />
                </AccessGate>
              ))
            )}
          </div>
        </div>
      </main>
    );
  }

  // Path contains folder slugs with IDs - extract the target folder ID
  const targetFolderSlug = path[path.length - 1];
  const targetFolderId = extractIdFromSlug(targetFolderSlug);
  
  console.log('[DocumentTypePathPage] Target folder slug:', targetFolderSlug);
  console.log('[DocumentTypePathPage] Extracted folder ID:', targetFolderId);
  console.log('[DocumentTypePathPage] Number of sections:', sections.length);
  
  // Find the section and get its folder structure
  let targetFolder: DriveFolder | null = null;
  let breadcrumbNames: string[] = [];
  let breadcrumbSlugs: string[] = [];
  let sectionId: string | null = null;

  for (const section of sections) {
    if (!section.driveFolderId) continue;
    
    console.log('[DocumentTypePathPage] Checking section:', section.id, 'with drive folder:', section.driveFolderId);
    
    try {
      const folderStructure = await getFolderStructure(section.driveFolderId);
      
      console.log('[DocumentTypePathPage] Folder structure root ID:', folderStructure.id);
      console.log('[DocumentTypePathPage] Folder structure root name:', folderStructure.name);
      
      // Check if the target folder ID matches the section's drive folder ID (root folder)
      if (section.driveFolderId === targetFolderId) {
        console.log('[DocumentTypePathPage] Found match at root level');
        targetFolder = folderStructure;
        breadcrumbNames = [folderStructure.name];
        breadcrumbSlugs = [createSlugWithId(folderStructure.name, folderStructure.id)];
        sectionId = section.id;
        break;
      }
      
      // Otherwise, search for it as a subfolder
      targetFolder = findFolderById(folderStructure, targetFolderId);
      
      if (targetFolder) {
        console.log('[DocumentTypePathPage] Found match in subfolders');
        const breadcrumbData = buildBreadcrumbPath(folderStructure, targetFolderId);
        breadcrumbNames = breadcrumbData?.names || [targetFolder.name];
        breadcrumbSlugs = breadcrumbData?.slugs || [createSlugWithId(targetFolder.name, targetFolder.id)];
        sectionId = section.id;
        break;
      }
    } catch (error) {
      console.error('[DocumentTypePathPage] Error fetching folder structure:', error);
    }
  }
  
  console.log('[DocumentTypePathPage] Final targetFolder:', targetFolder ? 'found' : 'not found');
  console.log('[DocumentTypePathPage] Final sectionId:', sectionId);

  if (!targetFolder || !sectionId) {
    return (
      <main style={{ backgroundColor: 'var(--parchment)' }}>
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
          <Link href="/documents" className="inline-flex items-center text-sm mb-6" style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-work-sans)' }}>
            <Home className="h-4 w-4 mr-2" />
            Back to Documents
          </Link>
          <EmptyState variant="error" title="Folder not found" description="The requested folder could not be found." />
        </div>
      </main>
    );
  }

  const folderName = targetFolder.name;
  const documentTypeLabel = DOCUMENT_TYPE_LABELS[normalizedType] || normalizedType;
  
  return (
    <main style={{ backgroundColor: 'var(--parchment)' }}>
      <IconSprite />
      <DocumentsContent>
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-2 text-sm pt-8">
            <Link 
              href="/documents" 
              className="flex items-center gap-1"
              style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-work-sans)' }}
            >
              <Home className="h-4 w-4" />
              Documents
            </Link>
            {breadcrumbNames.map((name, index) => (
              <div key={name} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4" style={{ color: 'var(--ink-faint)' }} />
                {index === breadcrumbNames.length - 1 ? (
                  <span style={{ color: 'var(--ink)', fontWeight: 600, fontFamily: 'var(--font-work-sans)' }}>{name}</span>
                ) : (
                  <Link 
                    href={`/documents/${typeParam}/${breadcrumbSlugs.slice(0, index + 1).join('/')}`}
                    style={{ color: 'var(--ink-faint)', fontFamily: 'var(--font-work-sans)' }}
                  >
                    {name}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Page header */}
          <div className="mb-8">
            <div className="eyebrow mb-4">DOCUMENTS / {documentTypeLabel.toUpperCase()}</div>
            <h1 style={{ 
              fontFamily: 'var(--font-alegreya)', 
              fontWeight: 700,
              fontSize: 'clamp(1.9rem, 3.4vw, 2.7rem)',
              color: 'var(--ink)',
              marginBottom: '0.5rem'
            }}>
              {folderName}
            </h1>
            <p style={{ 
              fontFamily: 'var(--font-work-sans)', 
              color: 'var(--ink-soft)',
              fontSize: '1rem',
              fontWeight: 400,
              lineHeight: '1.6'
            }}>
              {targetFolder.files.length} {targetFolder.files.length === 1 ? 'file' : 'files'} in this folder
            </p>
          </div>

          <AccessGate
            resourceType={RESOURCE_TYPES.DOCUMENT_SECTION}
            resourceId={sectionId}
            userGroupKeys={userGroupKeys}
          >
            {targetFolder.files.length === 0 ? (
              <EmptyState variant="coming-soon" title="No files" description="This folder is currently empty." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 reveal" style={{ gap: '24px' }}>
                {targetFolder.files.map((file) => (
                  <DocumentCard key={file.id} file={file} resourceType={RESOURCE_TYPES.DOCUMENT_SECTION} resourceId={sectionId} />
                ))}
              </div>
            )}
          </AccessGate>
        </div>
      </DocumentsContent>
    </main>
  );
}
