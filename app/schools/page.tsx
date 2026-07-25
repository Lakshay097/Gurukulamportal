import { adminDb, useAdminSDK, db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import SchoolCard from '@/components/school-card';
import { Search } from 'lucide-react';

async function getSchools() {
  if (useAdminSDK && adminDb) {
    // Use Admin SDK
    const snapshot = await adminDb.collection('schools').get();
    console.log(`Found ${snapshot.size} schools in database`);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } else {
    // Use Client SDK
    const schoolsSnapshot = await getDocs(collection(db, 'schools'));
    console.log(`Found ${schoolsSnapshot.size} schools in database`);
    return schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

export default async function SchoolsPage() {
  const schools = await getSchools();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Our Schools</h1>
          <p className="mt-2 text-gray-600">
            Explore our network of 12 campuses across India
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search schools by name or city..."
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Schools Grid */}
        {schools.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-600">No schools found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((school: any) => (
              <SchoolCard
                key={school.id}
                slug={school.slug}
                name={school.name}
                city={school.city}
                status={school.status}
                heroImageUrl={school.heroImageUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
