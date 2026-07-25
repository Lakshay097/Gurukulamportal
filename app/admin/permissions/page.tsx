"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DOC_SECTION_TYPES, RESOURCE_TYPES, ACCESS_LEVELS } from '@/lib/constants';

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
    { id: 'home', label: 'Home' },
    { id: 'schools', label: 'Schools' },
    { id: 'documents', label: 'Documents' },
    { id: 'cbse-rules', label: 'CBSE Rules' },
  ];

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Permissions</h1>
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

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left font-semibold">Resource</th>
              {groups.map((group) => (
                <th key={group.id} className="border px-4 py-2 text-center font-semibold">
                  {group.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Nav Resources */}
            {navResources.map((nav) => (
              <tr key={`nav-${nav.id}`}>
                <td className="border px-4 py-2 font-medium">{nav.label}</td>
                {groups.map((group) => {
                  const currentAccess = getPermission(
                    RESOURCE_TYPES.NAV_ITEM,
                    nav.id,
                    group.key
                  );
                  return (
                    <td key={group.id} className="border px-4 py-2 text-center">
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
                        className="w-5 h-5"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Document Sections */}
            {documentSections.map((section) => (
              <tr key={section.id}>
                <td className="border px-4 py-2 font-medium">
                  {section.type}
                  {section.schoolId && ` (${section.schoolId})`}
                </td>
                {groups.map((group) => {
                  const currentAccess = getPermission(
                    RESOURCE_TYPES.DOCUMENT_SECTION,
                    section.id,
                    group.key
                  );
                  return (
                    <td key={group.id} className="border px-4 py-2 text-center">
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
                        className="w-5 h-5"
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
  );
}
