'use client';

import { useState, useEffect } from 'react';
import SchoolCard from '@/components/school-card';
import { Search } from 'lucide-react';

interface School {
  id: string;
  slug: string;
  name: string;
  city: string;
  status: string;
  heroImageUrl?: string | null;
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchools() {
      try {
        const response = await fetch('/api/debug-schools');
        const data = await response.json();
        setSchools(data.schools || []);
        setFilteredSchools(data.schools || []);
      } catch (error) {
        console.error('Error fetching schools:', error);
        setSchools([]);
        setFilteredSchools([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSchools();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSchools(schools);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = schools.filter(
        (school) =>
          school.name.toLowerCase().includes(query) ||
          school.city.toLowerCase().includes(query)
      );
      setFilteredSchools(filtered);
    }
  }, [searchQuery, schools]);

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Schools Grid */}
        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-600">Loading schools...</p>
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-600">
              {searchQuery ? 'No schools match your search.' : 'No schools found.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSchools.map((school) => (
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
