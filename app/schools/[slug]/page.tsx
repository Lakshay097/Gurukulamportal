import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb, useAdminSDK, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import AccessGate from '@/components/access-gate';
import ComplianceBadge from '@/components/compliance-badge';
import EmptyState from '@/components/empty-state';
import DocumentRow from '@/components/document-row';
import { RESOURCE_TYPES, DOC_SECTION_TYPES } from '@/lib/constants';
import { 
  MapPin, 
  Calendar, 
  Award, 
  GraduationCap, 
  Users, 
  Building2,
  User,
  FileText,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

interface School {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  establishedYear?: number;
  cbseAffiliationNo?: string;
  cbseStatus?: string;
  board?: string;
  medium?: string;
  gradesOffered?: string;
  campusSize?: string;
  status: string;
  heroImageUrl?: string | null;
  about?: string;
  address?: string;
  lat?: number;
  lng?: number;
  principalName?: string;
  principalPhoto?: string;
  principalBio?: string;
  principalEmail?: string;
  enrollmentCurrent?: number;
  enrollmentCapacity?: number;
  staffCount?: number;
  facilities: string[];
  fireNocStatus?: string;
  lastAuditDate?: any;
  gallery?: string[];
}

interface DocumentSection {
  id: string;
  type: string;
  schoolId?: string;
  driveFolderId?: string;
  status: string;
}

async function getSchoolBySlug(slug: string): Promise<School | null> {
  try {
    console.log(`[getSchoolBySlug] useAdminSDK: ${useAdminSDK}, adminDb: ${adminDb ? 'defined' : 'undefined'}`);
    
    if (useAdminSDK && adminDb) {
      console.log(`[getSchoolBySlug] Using Admin SDK to fetch school with slug: ${slug}`);
      const snapshot = await adminDb.collection('schools').where('slug', '==', slug).get();
      console.log(`[getSchoolBySlug] Admin SDK query returned ${snapshot.size} documents`);
      
      if (snapshot.empty) {
        console.log(`[getSchoolBySlug] No school found with slug: ${slug}`);
        return null;
      }
      
      const schoolDoc = snapshot.docs[0];
      console.log(`[getSchoolBySlug] Found school: ${schoolDoc.data().name}`);
      return { id: schoolDoc.id, ...schoolDoc.data() } as School;
    } else {
      console.log(`[getSchoolBySlug] Using Client SDK to fetch school with slug: ${slug}`);
      const schoolsRef = collection(db, 'schools');
      const q = query(schoolsRef, where('slug', '==', slug));
      const snapshot = await getDocs(q);
      console.log(`[getSchoolBySlug] Client SDK query returned ${snapshot.size} documents`);
      
      if (snapshot.empty) {
        console.log(`[getSchoolBySlug] No school found with slug: ${slug}`);
        return null;
      }
      
      const schoolDoc = snapshot.docs[0];
      console.log(`[getSchoolBySlug] Found school: ${schoolDoc.data().name}`);
      return { id: schoolDoc.id, ...schoolDoc.data() } as School;
    }
  } catch (error) {
    console.error(`[getSchoolBySlug] Error fetching school by slug: ${slug}`, error);
    return null;
  }
}

async function getSchoolDocumentSections(schoolId: string): Promise<DocumentSection[]> {
  try {
    if (useAdminSDK && adminDb) {
      const snapshot = await adminDb
        .collection('documentSections')
        .where('schoolId', '==', schoolId)
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DocumentSection));
    } else {
      const sectionsRef = collection(db, 'documentSections');
      const q = query(sectionsRef, where('schoolId', '==', schoolId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DocumentSection));
    }
  } catch (error) {
    console.error('Error fetching school document sections:', error);
    return [];
  }
}

export default async function SchoolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const session = await getServerSession(authOptions);
  const userGroupKeys = (session as any)?.userGroupKeys || [];
  
  console.log(`Fetching school detail for slug: ${slug}`);
  const school = await getSchoolBySlug(slug);
  
  if (!school) {
    console.log(`School not found, returning 404 for slug: ${slug}`);
    notFound();
  }

  const documentSections = await getSchoolDocumentSections(school.id);
  
  // Filter to only show sections with driveFolderId
  const sectionsWithFolders = documentSections.filter(section => section.driveFolderId);
  console.log(`[SchoolDetailPage] Document sections with folders: ${sectionsWithFolders.length}/${documentSections.length}`);

  const facilityIcons: Record<string, any> = {
    'Science Labs': GraduationCap,
    'Library': FileText,
    'Sports Complex': Users,
    'Auditorium': Building2,
    'Smart Classrooms': Award,
    'Transport': MapPin,
    'Hostel': Building2,
    'Health Room': User,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div className="relative h-64 md:h-96 w-full bg-gradient-to-br from-amber-100 to-amber-200">
        {school.heroImageUrl ? (
          <img
            src={school.heroImageUrl}
            alt={`${school.name} campus`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 className="h-24 w-24 text-amber-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">{school.name}</h1>
          <p className="text-lg text-white/90">{school.city}, {school.state}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Facts Strip */}
        <div className="mb-8 grid grid-cols-2 gap-4 rounded-lg border bg-white p-6 md:grid-cols-4">
          {school.establishedYear && (
            <div className="text-center">
              <Calendar className="mx-auto h-6 w-6 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900">Est. {school.establishedYear}</p>
              <p className="text-xs text-gray-600">Established</p>
            </div>
          )}
          {school.cbseAffiliationNo && (
            <div className="text-center">
              <Award className="mx-auto h-6 w-6 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900">{school.cbseAffiliationNo}</p>
              <p className="text-xs text-gray-600">CBSE Affiliation</p>
            </div>
          )}
          {school.gradesOffered && (
            <div className="text-center">
              <GraduationCap className="mx-auto h-6 w-6 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900">{school.gradesOffered}</p>
              <p className="text-xs text-gray-600">Grades</p>
            </div>
          )}
          {school.campusSize && (
            <div className="text-center">
              <Building2 className="mx-auto h-6 w-6 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900">{school.campusSize}</p>
              <p className="text-xs text-gray-600">Campus Size</p>
            </div>
          )}
        </div>

        {/* About Section */}
        {school.about && (
          <div className="mb-8 rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">About This Campus</h2>
            <p className="text-gray-700 whitespace-pre-line">{school.about}</p>
          </div>
        )}

        {/* Leadership - Gated: internal-staff + admin-central */}
        <AccessGate
          resourceType="school_field"
          resourceId={`leadership-${school.id}`}
          userGroupKeys={userGroupKeys}
        >
          <div className="mb-8 rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Leadership</h2>
            {school.principalName ? (
              <div className="flex items-start gap-4">
                {school.principalPhoto ? (
                  <img
                    src={school.principalPhoto}
                    alt={school.principalName}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{school.principalName}</h3>
                  <p className="text-sm text-gray-600">Principal</p>
                  {school.principalBio && (
                    <p className="mt-2 text-sm text-gray-700">{school.principalBio}</p>
                  )}
                  {school.principalEmail && (
                    <a
                      href={`mailto:${school.principalEmail}`}
                      className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      {school.principalEmail}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState variant="coming-soon" title="Leadership information coming soon" />
            )}
          </div>
        </AccessGate>

        {/* Facilities - Public */}
        {school.facilities && school.facilities.length > 0 && (
          <div className="mb-8 rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Facilities</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {school.facilities.map((facility: string) => {
                const Icon = facilityIcons[facility] || CheckCircle2;
                return (
                  <div
                    key={facility}
                    className="flex items-center gap-2 rounded-lg border p-3 bg-gray-50"
                  >
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{facility}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Compliance Status - Gated: internal-staff + admin-central */}
        <AccessGate
          resourceType="school_field"
          resourceId={`compliance-${school.id}`}
          userGroupKeys={userGroupKeys}
        >
          <div className="mb-8 rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Compliance Status</h2>
            <ComplianceBadge
              cbseStatus={school.cbseStatus}
              fireNocStatus={school.fireNocStatus}
              lastAuditDate={school.lastAuditDate?.toDate()}
            />
          </div>
        </AccessGate>

        {/* Enrollment Snapshot - Gated: admin-central only */}
        <AccessGate
          resourceType="school_field"
          resourceId={`enrollment-${school.id}`}
          userGroupKeys={userGroupKeys}
        >
          <div className="mb-8 rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Enrollment Snapshot</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4 bg-gray-50 text-center">
                <p className="text-2xl font-bold text-gray-900">{school.enrollmentCurrent || 'N/A'}</p>
                <p className="text-sm text-gray-600">Current Students</p>
              </div>
              <div className="rounded-lg border p-4 bg-gray-50 text-center">
                <p className="text-2xl font-bold text-gray-900">{school.enrollmentCapacity || 'N/A'}</p>
                <p className="text-sm text-gray-600">Capacity</p>
              </div>
              <div className="rounded-lg border p-4 bg-gray-50 text-center">
                <p className="text-2xl font-bold text-gray-900">{school.staffCount || 'N/A'}</p>
                <p className="text-sm text-gray-600">Staff Count</p>
              </div>
            </div>
          </div>
        </AccessGate>

        {/* Documents Tab */}
        <div className="mb-8 rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Documents</h2>
          {sectionsWithFolders.length === 0 ? (
            <EmptyState variant="coming-soon" title="Documents coming soon" description="School documents will be available here soon once they are configured in Google Drive." />
          ) : (
            <div className="space-y-6">
              {sectionsWithFolders.map((section: any) => (
                <AccessGate
                  key={section.id}
                  resourceType={RESOURCE_TYPES.DOCUMENT_SECTION}
                  resourceId={section.id}
                  userGroupKeys={userGroupKeys}
                >
                  <DocumentRow
                    title={section.type}
                    folderId={section.driveFolderId || null}
                    resourceType={RESOURCE_TYPES.DOCUMENT_SECTION}
                    resourceId={section.id}
                  />
                </AccessGate>
              ))}
            </div>
          )}
        </div>

        {/* Location - Public */}
        {school.address && (
          <div className="mb-8 rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Location</h2>
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-gray-600 flex-shrink-0" />
              <div>
                <p className="text-gray-700">{school.address}</p>
                <p className="text-sm text-gray-600">{school.city}, {school.state}</p>
              </div>
            </div>
            {school.lat && school.lng && (
              <div className="mt-4 h-64 w-full rounded-lg bg-gray-100">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps?q=${school.lat},${school.lng}&z=15&output=embed`}
                  title="School Location"
                />
              </div>
            )}
          </div>
        )}

        {/* Gallery - Optional, Public */}
        {school.gallery && school.gallery.length > 0 && (
          <div className="mb-8 rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Gallery</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {school.gallery.map((photo: string, index: number) => (
                <img
                  key={index}
                  src={photo}
                  alt={`${school.name} gallery ${index + 1}`}
                  className="h-48 w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
