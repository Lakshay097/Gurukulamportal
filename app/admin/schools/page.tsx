"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SCHOOL_STATUS, CBSE_STATUS, FIRE_NOC_STATUS, FACILITIES } from '@/lib/constants';

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
  heroImageUrl?: string;
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
  createdAt: any;
}

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSchool, setEditingSchool] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<School>>({});
  const [preconverting, setPreconverting] = useState(false);
  const [preconvertResult, setPreconvertResult] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/schools');
      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school.id);
    setEditData({ ...school });
  };

  const handleCancel = () => {
    setEditingSchool(null);
    setEditData({});
  };

  const handleSave = async (schoolId: string) => {
    try {
      const response = await fetch('/api/admin/schools', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          updates: editData,
        }),
      });

      if (response.ok) {
        await fetchData();
        setEditingSchool(null);
        setEditData({});
      }
    } catch (error) {
      console.error('Error updating school:', error);
    }
  };

  const handleFacilityToggle = (facility: string) => {
    const currentFacilities = editData.facilities || [];
    const newFacilities = currentFacilities.includes(facility)
      ? currentFacilities.filter((f) => f !== facility)
      : [...currentFacilities, facility];
    setEditData({ ...editData, facilities: newFacilities });
  };

  const handlePreconvert = async () => {
    setPreconverting(true);
    setPreconvertResult(null);
    try {
      console.log('Starting pre-conversion...');
      const response = await fetch('/api/admin/preconvert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('Pre-conversion response status:', response.status);
      const data = await response.json();
      console.log('Pre-conversion result:', data);
      setPreconvertResult(data);
    } catch (error) {
      console.error('Pre-conversion failed:', error);
      setPreconvertResult({ ok: false, error: 'Pre-conversion failed: ' + String(error) });
    } finally {
      setPreconverting(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Schools</h1>
        <Button onClick={handlePreconvert} disabled={preconverting}>
          {preconverting ? 'Pre-converting...' : 'Pre-convert All Documents'}
        </Button>
      </div>

      {preconvertResult && (
        <div className={`mb-6 p-4 rounded ${preconvertResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className={`font-semibold mb-2 ${preconvertResult.ok ? 'text-green-800' : 'text-red-800'}`}>
            {preconvertResult.ok ? 'Pre-conversion Complete' : 'Pre-conversion Failed'}
          </h3>
          {preconvertResult.ok && preconvertResult.result && (
            <div className="text-sm text-gray-700">
              <p>Total: {preconvertResult.result.total}</p>
              <p>Converted: {preconvertResult.result.converted}</p>
              <p>Skipped: {preconvertResult.result.skipped}</p>
              <p>Failed: {preconvertResult.result.failed}</p>
              {preconvertResult.result.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-red-600">View Errors ({preconvertResult.result.errors.length})</summary>
                  <ul className="mt-2 space-y-1">
                    {preconvertResult.result.errors.map((err: any, idx: number) => (
                      <li key={idx} className="text-xs">
                        {err.name}: {err.error}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
          {!preconvertResult.ok && (
            <p className="text-sm text-red-700">{preconvertResult.error}</p>
          )}
        </div>
      )}

      <div className="space-y-8">
        {schools.map((school) => (
          <div key={school.id} className="border rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">{school.name}</h2>
              {editingSchool === school.id ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSave(school.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => handleEdit(school)}>
                  Edit
                </Button>
              )}
            </div>

            {editingSchool === school.id ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    value={editData.slug || ''}
                    onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={editData.city || ''}
                    onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={editData.state || ''}
                    onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Established Year</label>
                  <input
                    type="number"
                    value={editData.establishedYear || ''}
                    onChange={(e) => setEditData({ ...editData, establishedYear: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CBSE Affiliation No</label>
                  <input
                    type="text"
                    value={editData.cbseAffiliationNo || ''}
                    onChange={(e) => setEditData({ ...editData, cbseAffiliationNo: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CBSE Status</label>
                  <select
                    value={editData.cbseStatus || ''}
                    onChange={(e) => setEditData({ ...editData, cbseStatus: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Select...</option>
                    <option value={CBSE_STATUS.PROVISIONAL}>{CBSE_STATUS.PROVISIONAL}</option>
                    <option value={CBSE_STATUS.PERMANENT}>{CBSE_STATUS.PERMANENT}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={editData.status || SCHOOL_STATUS.PRE_LAUNCH}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value={SCHOOL_STATUS.OPERATIONAL}>{SCHOOL_STATUS.OPERATIONAL}</option>
                    <option value={SCHOOL_STATUS.UNDER_CONSTRUCTION}>{SCHOOL_STATUS.UNDER_CONSTRUCTION}</option>
                    <option value={SCHOOL_STATUS.PRE_LAUNCH}>{SCHOOL_STATUS.PRE_LAUNCH}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Board</label>
                  <input
                    type="text"
                    value={editData.board || ''}
                    onChange={(e) => setEditData({ ...editData, board: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Medium</label>
                  <input
                    type="text"
                    value={editData.medium || ''}
                    onChange={(e) => setEditData({ ...editData, medium: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Grades Offered</label>
                  <input
                    type="text"
                    value={editData.gradesOffered || ''}
                    onChange={(e) => setEditData({ ...editData, gradesOffered: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Campus Size</label>
                  <input
                    type="text"
                    value={editData.campusSize || ''}
                    onChange={(e) => setEditData({ ...editData, campusSize: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hero Image URL</label>
                  <input
                    type="text"
                    value={editData.heroImageUrl || ''}
                    onChange={(e) => setEditData({ ...editData, heroImageUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    type="text"
                    value={editData.address || ''}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Principal Name</label>
                  <input
                    type="text"
                    value={editData.principalName || ''}
                    onChange={(e) => setEditData({ ...editData, principalName: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Principal Email</label>
                  <input
                    type="text"
                    value={editData.principalEmail || ''}
                    onChange={(e) => setEditData({ ...editData, principalEmail: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Enrollment Current</label>
                  <input
                    type="number"
                    value={editData.enrollmentCurrent || ''}
                    onChange={(e) => setEditData({ ...editData, enrollmentCurrent: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Enrollment Capacity</label>
                  <input
                    type="number"
                    value={editData.enrollmentCapacity || ''}
                    onChange={(e) => setEditData({ ...editData, enrollmentCapacity: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Staff Count</label>
                  <input
                    type="number"
                    value={editData.staffCount || ''}
                    onChange={(e) => setEditData({ ...editData, staffCount: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fire NOC Status</label>
                  {[FIRE_NOC_STATUS.GREEN, FIRE_NOC_STATUS.AMBER, FIRE_NOC_STATUS.RED].map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`fireNoc-${school.id}`}
                        value={status}
                        checked={editData.fireNocStatus === status}
                        onChange={(e) => setEditData({ ...editData, fireNocStatus: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm capitalize">{status}</span>
                    </label>
                  ))}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">About</label>
                  <textarea
                    value={editData.about || ''}
                    onChange={(e) => setEditData({ ...editData, about: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Principal Bio</label>
                  <textarea
                    value={editData.principalBio || ''}
                    onChange={(e) => setEditData({ ...editData, principalBio: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Facilities</label>
                  <div className="flex flex-wrap gap-2">
                    {FACILITIES.map((facility) => (
                      <label key={facility} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(editData.facilities || []).includes(facility)}
                          onChange={() => handleFacilityToggle(facility)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{facility}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Slug:</span>
                  <p className="font-medium">{school.slug}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">City:</span>
                  <p className="font-medium">{school.city}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">State:</span>
                  <p className="font-medium">{school.state}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <p className="font-medium">{school.status}</p>
                </div>
                {school.establishedYear && (
                  <div>
                    <span className="text-sm text-gray-600">Established:</span>
                    <p className="font-medium">{school.establishedYear}</p>
                  </div>
                )}
                {school.cbseAffiliationNo && (
                  <div>
                    <span className="text-sm text-gray-600">CBSE Affiliation No:</span>
                    <p className="font-medium">{school.cbseAffiliationNo}</p>
                  </div>
                )}
                {school.cbseStatus && (
                  <div>
                    <span className="text-sm text-gray-600">CBSE Status:</span>
                    <p className="font-medium">{school.cbseStatus}</p>
                  </div>
                )}
                {school.board && (
                  <div>
                    <span className="text-sm text-gray-600">Board:</span>
                    <p className="font-medium">{school.board}</p>
                  </div>
                )}
                {school.medium && (
                  <div>
                    <span className="text-sm text-gray-600">Medium:</span>
                    <p className="font-medium">{school.medium}</p>
                  </div>
                )}
                {school.gradesOffered && (
                  <div>
                    <span className="text-sm text-gray-600">Grades:</span>
                    <p className="font-medium">{school.gradesOffered}</p>
                  </div>
                )}
                {school.campusSize && (
                  <div>
                    <span className="text-sm text-gray-600">Campus Size:</span>
                    <p className="font-medium">{school.campusSize}</p>
                  </div>
                )}
                {school.address && (
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">Address:</span>
                    <p className="font-medium">{school.address}</p>
                  </div>
                )}
                {school.about && (
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">About:</span>
                    <p className="font-medium">{school.about}</p>
                  </div>
                )}
                {school.principalName && (
                  <div>
                    <span className="text-sm text-gray-600">Principal:</span>
                    <p className="font-medium">{school.principalName}</p>
                  </div>
                )}
                {school.principalEmail && (
                  <div>
                    <span className="text-sm text-gray-600">Principal Email:</span>
                    <p className="font-medium">{school.principalEmail}</p>
                  </div>
                )}
                {school.enrollmentCurrent !== undefined && (
                  <div>
                    <span className="text-sm text-gray-600">Enrollment (Current):</span>
                    <p className="font-medium">{school.enrollmentCurrent}</p>
                  </div>
                )}
                {school.enrollmentCapacity !== undefined && (
                  <div>
                    <span className="text-sm text-gray-600">Enrollment (Capacity):</span>
                    <p className="font-medium">{school.enrollmentCapacity}</p>
                  </div>
                )}
                {school.staffCount !== undefined && (
                  <div>
                    <span className="text-sm text-gray-600">Staff Count:</span>
                    <p className="font-medium">{school.staffCount}</p>
                  </div>
                )}
                {school.fireNocStatus && (
                  <div>
                    <span className="text-sm text-gray-600">Fire NOC Status:</span>
                    <p className="font-medium capitalize">{school.fireNocStatus}</p>
                  </div>
                )}
                {school.facilities && school.facilities.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">Facilities:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {school.facilities.map((facility) => (
                        <span key={facility} className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
