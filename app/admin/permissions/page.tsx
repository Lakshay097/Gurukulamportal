"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DOC_SECTION_TYPES, RESOURCE_TYPES, ACCESS_LEVELS, DOCUMENT_TYPE_LABELS } from '@/lib/constants';

interface Group {
  id: string;
  key: string;
  label: string;
  colorTier: string;
}

interface DocumentSection {
  id: string;
  type: string;
  schoolId?: string;
  driveFolderId?: string;
  status: string;
}

interface PermissionRule {
  id: string;
  resourceType: string;
  resourceId: string;
  groupKey: string;
  accessLevel: string;
  documentSectionId?: string;
}

export default function AdminPermissionsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [documentSections, setDocumentSections] = useState<DocumentSection[]>([]);
  const [permissionRules, setPermissionRules] = useState<PermissionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupKey, setNewGroupKey] = useState('');
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [newGroupColorTier, setNewGroupColorTier] = useState('internal');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/permissions');
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
        setDocumentSections(data.documentSections);
        setPermissionRules(data.permissionRules);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async () => {
    if (!newGroupKey || !newGroupLabel || !newGroupColorTier) return;

    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newGroupKey,
          label: newGroupLabel,
          colorTier: newGroupColorTier,
        }),
      });

      if (response.ok) {
        await fetchData();
        setNewGroupKey('');
        setNewGroupLabel('');
        setNewGroupColorTier('internal');
        setShowAddGroup(false);
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handlePermissionChange = async (
    resourceType: string,
    resourceId: string,
    groupKey: string,
    accessLevel: string,
    documentSectionId?: string
  ) => {
    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType,
          resourceId,
          groupKey,
          accessLevel,
          documentSectionId,
        }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const getPermission = (
    resourceType: string,
    resourceId: string,
    groupKey: string
  ): string => {
    const rule = permissionRules.find(
      (r) =>
        r.resourceType === resourceType &&
        r.resourceId === resourceId &&
        r.groupKey === groupKey
    );
    return rule?.accessLevel || ACCESS_LEVELS.NONE;
  };

  const navResources = [
    { id: 'home', label: 'Home', description: 'Main landing page' },
    { id: 'schools', label: 'Schools', description: 'School directory and details' },
    { id: 'documents', label: 'Documents', description: 'Document repository' },
    { id: 'cbse-rules', label: 'CBSE Rules', description: 'Compliance rules' },
  ];

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Permissions</h1>
          <p className="text-gray-600 mt-1">Manage which user groups can access different resources</p>
        </div>
        <Button onClick={() => setShowAddGroup(!showAddGroup)}>
          + Add Group
        </Button>
      </div>

      {showAddGroup && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-4">Create New Group</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Key</label>
              <input
                type="text"
                value={newGroupKey}
                onChange={(e) => setNewGroupKey(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g., finance-central"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <input
                type="text"
                value={newGroupLabel}
                onChange={(e) => setNewGroupLabel(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g., Finance Central"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color Tier</label>
              <select
                value={newGroupColorTier}
                onChange={(e) => setNewGroupColorTier(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="admin">Admin</option>
                <option value="internal">Internal</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleAddGroup}>Create Group</Button>
            <Button variant="outline" onClick={() => setShowAddGroup(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Navigation Permissions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Navigation Items</h2>
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Page</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                {groups.map((group) => (
                  <th key={group.id} className="px-4 py-3 text-center font-semibold text-gray-700">
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-200">
                      {group.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {navResources.map((nav) => (
                <tr key={`nav-${nav.id}`} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{nav.label}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{nav.description}</td>
                  {groups.map((group) => {
                    const currentAccess = getPermission(
                      RESOURCE_TYPES.NAV_ITEM,
                      nav.id,
                      group.key
                    );
                    return (
                      <td key={group.id} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={currentAccess === ACCESS_LEVELS.VIEW}
                          onChange={(e) =>
                            handlePermissionChange(
                              RESOURCE_TYPES.NAV_ITEM,
                              nav.id,
                              group.key,
                              e.target.checked ? ACCESS_LEVELS.VIEW : ACCESS_LEVELS.NONE
                            )
                          }
                          className="w-5 h-5 rounded border-gray-300"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Section Permissions */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Document Sections</h2>
        {documentSections.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
            No document sections found. Document sections will appear here once created.
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Document Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">School</th>
                  {groups.map((group) => (
                    <th key={group.id} className="px-4 py-3 text-center font-semibold text-gray-700">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-200">
                        {group.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documentSections.map((section) => (
                  <tr key={section.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {DOCUMENT_TYPE_LABELS[section.type] || section.type}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {section.schoolId || 'All Schools'}
                    </td>
                    {groups.map((group) => {
                      const currentAccess = getPermission(
                        RESOURCE_TYPES.DOCUMENT_SECTION,
                        section.id,
                        group.key
                      );
                      return (
                        <td key={group.id} className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={currentAccess === ACCESS_LEVELS.VIEW}
                            onChange={(e) =>
                              handlePermissionChange(
                                RESOURCE_TYPES.DOCUMENT_SECTION,
                                section.id,
                                group.key,
                                e.target.checked ? ACCESS_LEVELS.VIEW : ACCESS_LEVELS.NONE,
                                section.id
                              )
                            }
                            className="w-5 h-5 rounded border-gray-300"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
