"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DOC_SECTION_TYPES, RESOURCE_TYPES, ACCESS_LEVELS, DOCUMENT_TYPE_LABELS } from '@/lib/constants';
import { Plus, Users, Shield, FileText, Navigation, Check, X, Clock } from 'lucide-react';

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

interface AccessRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  groupKey: string;
  groupLabel: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: string;
}

export default function AdminPermissionsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [documentSections, setDocumentSections] = useState<DocumentSection[]>([]);
  const [allDocumentSections, setAllDocumentSections] = useState<DocumentSection[]>([]);
  const [permissionRules, setPermissionRules] = useState<PermissionRule[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupKey, setNewGroupKey] = useState('');
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [newGroupColorTier, setNewGroupColorTier] = useState('internal');
  const [activeTab, setActiveTab] = useState<'permissions' | 'groups' | 'requests'>('permissions');
  const [showAllSections, setShowAllSections] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [permResponse, reqResponse] = await Promise.all([
        fetch('/api/admin/permissions'),
        fetch('/api/admin/access-requests')
      ]);
      
      if (permResponse.ok) {
        const data = await permResponse.json();
        setGroups(data.groups);
        setAllDocumentSections(data.documentSections);
        // Filter to show only central document sections (schoolId: null) by default
        setDocumentSections(data.documentSections.filter((s: DocumentSection) => !s.schoolId));
        setPermissionRules(data.permissionRules);
      }
      
      if (reqResponse.ok) {
        const reqData = await reqResponse.json();
        setAccessRequests(reqData.requests || []);
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
    setSaving(true);
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
    } finally {
      setSaving(false);
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
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--parchment)' }}>
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }}></div>
          <p className="mt-4" style={{ color: 'var(--ink-soft)' }}>Loading permissions...</p>
        </div>
      </div>
    );
  }

  const getGroupColor = (colorTier: string) => {
    switch (colorTier) {
      case 'admin': return 'var(--color-admin)';
      case 'internal': return 'var(--color-internal)';
      case 'other': return 'var(--color-other)';
      default: return 'var(--ink)';
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/admin/access-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'approve' }),
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/admin/access-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'deny' }),
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error denying request:', error);
    }
  };

  const pendingRequests = accessRequests.filter(r => r.status === 'pending');

  const toggleShowAllSections = () => {
    if (showAllSections) {
      setDocumentSections(allDocumentSections.filter((s: DocumentSection) => !s.schoolId));
    } else {
      setDocumentSections(allDocumentSections);
    }
    setShowAllSections(!showAllSections);
  };

  return (
    <div className="p-8" style={{ backgroundColor: 'var(--parchment)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8" style={{ color: 'var(--gold)' }} />
          <h1 className="text-4xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-alegreya)' }}>
            Permissions & Groups
          </h1>
          {saving && (
            <span className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--gold)', color: 'var(--ink)' }}>
              Saving...
            </span>
          )}
        </div>
        <p style={{ color: 'var(--ink-soft)' }}>
          Manage user groups, access permissions, and membership requests
        </p>
        <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--line)' }}>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            <strong style={{ color: 'var(--ink)' }}>How it works:</strong> Click the toggle buttons to grant or revoke access. 
            Colored buttons indicate the group has access. Changes are saved immediately to the database.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--panel)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(209, 155, 60, 0.1)' }}>
              <Users className="w-6 h-6" style={{ color: 'var(--gold)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{groups.length}</p>
              <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Total Groups</p>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--panel)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(81, 183, 73, 0.1)' }}>
              <FileText className="w-6 h-6" style={{ color: 'var(--color-internal)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{documentSections.length}</p>
              <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Central Document Sections</p>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--panel)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(193, 89, 43, 0.1)' }}>
              <Clock className="w-6 h-6" style={{ color: 'var(--terracotta)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{pendingRequests.length}</p>
              <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Pending Requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b" style={{ borderColor: 'var(--line)' }}>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'permissions'
              ? 'border-b-2'
              : 'hover:bg-gray-50'
          }`}
          style={
            activeTab === 'permissions'
              ? { borderColor: 'var(--gold)', color: 'var(--ink)' }
              : { color: 'var(--ink-soft)' }
          }
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Permissions
          </div>
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'groups'
              ? 'border-b-2'
              : 'hover:bg-gray-50'
          }`}
          style={
            activeTab === 'groups'
              ? { borderColor: 'var(--gold)', color: 'var(--ink)' }
              : { color: 'var(--ink-soft)' }
          }
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Groups
          </div>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'requests'
              ? 'border-b-2'
              : 'hover:bg-gray-50'
          }`}
          style={
            activeTab === 'requests'
              ? { borderColor: 'var(--gold)', color: 'var(--ink)' }
              : { color: 'var(--ink-soft)' }
          }
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Access Requests
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: 'var(--terracotta)', color: 'white' }}>
                {pendingRequests.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="space-y-8">
          {/* Navigation Permissions */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Navigation className="w-5 h-5" style={{ color: 'var(--gold)' }} />
              <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-alegreya)' }}>
                Navigation Items
              </h2>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--panel)', boxShadow: 'var(--shadow-sm)' }}>
              <table className="min-w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--parchment-deep)' }}>
                    <th className="px-6 py-4 text-left font-semibold" style={{ color: 'var(--ink)' }}>Page</th>
                    <th className="px-6 py-4 text-left font-semibold" style={{ color: 'var(--ink)' }}>Description</th>
                    {groups.map((group) => (
                      <th key={group.id} className="px-4 py-4 text-center font-semibold" style={{ color: 'var(--ink)' }}>
                        <span
                          className="inline-block px-3 py-1.5 rounded-lg text-sm font-medium"
                          style={{ backgroundColor: `${getGroupColor(group.colorTier)}20`, color: getGroupColor(group.colorTier) }}
                        >
                          {group.label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {navResources.map((nav, idx) => (
                    <tr
                      key={`nav-${nav.id}`}
                      className={`transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50'}`}
                      style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(22,33,61,0.02)' }}
                    >
                      <td className="px-6 py-4 font-medium" style={{ color: 'var(--ink)' }}>{nav.label}</td>
                      <td className="px-6 py-4" style={{ color: 'var(--ink-soft)' }}>{nav.description}</td>
                      {groups.map((group) => {
                        const currentAccess = getPermission(
                          RESOURCE_TYPES.NAV_ITEM,
                          nav.id,
                          group.key
                        );
                        return (
                          <td key={group.id} className="px-4 py-4 text-center">
                            <button
                              onClick={() =>
                                handlePermissionChange(
                                  RESOURCE_TYPES.NAV_ITEM,
                                  nav.id,
                                  group.key,
                                  currentAccess === ACCESS_LEVELS.VIEW ? ACCESS_LEVELS.NONE : ACCESS_LEVELS.VIEW
                                )
                              }
                              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                                currentAccess === ACCESS_LEVELS.VIEW
                                  ? 'shadow-md'
                                  : 'border-2'
                              }`}
                              style={
                                currentAccess === ACCESS_LEVELS.VIEW
                                  ? { backgroundColor: getGroupColor(group.colorTier), color: 'white' }
                                  : { borderColor: 'var(--line)', color: 'var(--ink-faint)' }
                              }
                            >
                              {currentAccess === ACCESS_LEVELS.VIEW && <Check className="w-5 h-5" />}
                            </button>
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-alegreya)' }}>
                  Document Sections
                </h2>
              </div>
              <button
                onClick={toggleShowAllSections}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--parchment)', color: 'var(--ink)' }}
              >
                {showAllSections ? 'Show Central Only' : `Show All (${allDocumentSections.length})`}
              </button>
            </div>
            {documentSections.length === 0 ? (
              <div className="p-12 text-center rounded-xl" style={{ backgroundColor: 'var(--panel)', boxShadow: 'var(--shadow-sm)' }}>
                <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--ink-faint)' }} />
                <p style={{ color: 'var(--ink-soft)' }}>No document sections found</p>
                <p className="text-sm mt-1" style={{ color: 'var(--ink-faint)' }}>Document sections will appear here once created</p>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--panel)', boxShadow: 'var(--shadow-sm)' }}>
                <table className="min-w-full">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--parchment-deep)' }}>
                      <th className="px-6 py-4 text-left font-semibold" style={{ color: 'var(--ink)' }}>Document Type</th>
                      <th className="px-6 py-4 text-left font-semibold" style={{ color: 'var(--ink)' }}>School</th>
                      {groups.map((group) => (
                        <th key={group.id} className="px-4 py-4 text-center font-semibold" style={{ color: 'var(--ink)' }}>
                          <span
                            className="inline-block px-3 py-1.5 rounded-lg text-sm font-medium"
                            style={{ backgroundColor: `${getGroupColor(group.colorTier)}20`, color: getGroupColor(group.colorTier) }}
                          >
                            {group.label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {documentSections.map((section, idx) => (
                      <tr
                        key={section.id}
                        className={`transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50'}`}
                        style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(22,33,61,0.02)' }}
                      >
                        <td className="px-6 py-4 font-medium" style={{ color: 'var(--ink)' }}>
                          {DOCUMENT_TYPE_LABELS[section.type] || section.type}
                        </td>
                        <td className="px-6 py-4" style={{ color: 'var(--ink-soft)' }}>
                          {section.schoolId || 'All Schools'}
                        </td>
                        {groups.map((group) => {
                          const currentAccess = getPermission(
                            RESOURCE_TYPES.DOCUMENT_SECTION,
                            section.id,
                            group.key
                          );
                          return (
                            <td key={group.id} className="px-4 py-4 text-center">
                              <button
                                onClick={() =>
                                  handlePermissionChange(
                                    RESOURCE_TYPES.DOCUMENT_SECTION,
                                    section.id,
                                    group.key,
                                    currentAccess === ACCESS_LEVELS.VIEW ? ACCESS_LEVELS.NONE : ACCESS_LEVELS.VIEW,
                                    section.id
                                  )
                                }
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                                  currentAccess === ACCESS_LEVELS.VIEW
                                    ? 'shadow-md'
                                    : 'border-2'
                                }`}
                                style={
                                  currentAccess === ACCESS_LEVELS.VIEW
                                    ? { backgroundColor: getGroupColor(group.colorTier), color: 'white' }
                                    : { borderColor: 'var(--line)', color: 'var(--ink-faint)' }
                                }
                              >
                                {currentAccess === ACCESS_LEVELS.VIEW && <Check className="w-5 h-5" />}
                              </button>
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
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" style={{ color: 'var(--gold)' }} />
              <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-alegreya)' }}>
                User Groups
              </h2>
            </div>
            <Button
              onClick={() => setShowAddGroup(!showAddGroup)}
              className="flex items-center gap-2"
              style={{ backgroundColor: 'var(--gold)', color: 'var(--ink)' }}
            >
              <Plus className="w-4 h-4" />
              Add Group
            </Button>
          </div>

          {showAddGroup && (
            <div className="mb-6 p-6 rounded-xl" style={{ backgroundColor: 'var(--panel)', boxShadow: 'var(--shadow-md)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--ink)' }}>Create New Group</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>Key</label>
                  <input
                    type="text"
                    value={newGroupKey}
                    onChange={(e) => setNewGroupKey(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
                    style={{ borderColor: 'var(--line)', backgroundColor: 'var(--parchment)' }}
                    placeholder="e.g., finance-central"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>Label</label>
                  <input
                    type="text"
                    value={newGroupLabel}
                    onChange={(e) => setNewGroupLabel(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
                    style={{ borderColor: 'var(--line)', backgroundColor: 'var(--parchment)' }}
                    placeholder="e.g., Finance Central"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink)' }}>Color Tier</label>
                  <select
                    value={newGroupColorTier}
                    onChange={(e) => setNewGroupColorTier(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
                    style={{ borderColor: 'var(--line)', backgroundColor: 'var(--parchment)' }}
                  >
                    <option value="admin">Admin (Blue)</option>
                    <option value="internal">Internal (Green)</option>
                    <option value="other">Other (Yellow)</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleAddGroup}
                  className="flex items-center gap-2"
                  style={{ backgroundColor: 'var(--gold)', color: 'var(--ink)' }}
                >
                  <Plus className="w-4 h-4" />
                  Create Group
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddGroup(false)}
                  className="flex items-center gap-2"
                  style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className="p-6 rounded-xl transition-all hover:shadow-lg"
                style={{ backgroundColor: 'var(--panel)', boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${getGroupColor(group.colorTier)}20` }}
                  >
                    <Users className="w-6 h-6" style={{ color: getGroupColor(group.colorTier) }} />
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide"
                    style={{ backgroundColor: `${getGroupColor(group.colorTier)}20`, color: getGroupColor(group.colorTier) }}
                  >
                    {group.colorTier}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)', fontFamily: 'var(--font-alegreya)' }}>
                  {group.label}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                  {group.key}
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: 'var(--parchment)', color: 'var(--ink)' }}>
                    Edit Members
                  </button>
                  <button className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: 'var(--parchment)', color: 'var(--ink)' }}>
                    View Permissions
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Access Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5" style={{ color: 'var(--gold)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-alegreya)' }}>
              Access Requests
            </h2>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center rounded-xl" style={{ backgroundColor: 'var(--panel)', boxShadow: 'var(--shadow-sm)' }}>
              <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--ink-faint)' }} />
              <p style={{ color: 'var(--ink-soft)' }}>No pending access requests</p>
              <p className="text-sm mt-1" style={{ color: 'var(--ink-faint)' }}>Requests will appear here when users request group access</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-6 rounded-xl flex items-center justify-between"
                  style={{ backgroundColor: 'var(--panel)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold"
                      style={{ backgroundColor: 'var(--parchment-deep)', color: 'var(--ink)' }}
                    >
                      {request.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--ink)' }}>{request.userName}</p>
                      <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>{request.userEmail}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>requests access to</span>
                        <span
                          className="px-2 py-0.5 rounded text-sm font-medium"
                          style={{ backgroundColor: `${getGroupColor(request.groupKey === 'admin-central' ? 'admin' : 'internal')}20`, color: getGroupColor(request.groupKey === 'admin-central' ? 'admin' : 'internal') }}
                        >
                          {request.groupLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDenyRequest(request.id)}
                      className="p-3 rounded-lg transition-colors hover:bg-red-50"
                      style={{ color: 'var(--destructive)' }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleApproveRequest(request.id)}
                      className="p-3 rounded-lg transition-colors"
                      style={{ backgroundColor: 'var(--color-internal)', color: 'white' }}
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
