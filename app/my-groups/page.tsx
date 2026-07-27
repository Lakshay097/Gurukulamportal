"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Plus, Clock, Check, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Group {
  id: string;
  key: string;
  label: string;
  colorTier: string;
}

interface AccessRequest {
  id: string;
  userId: string;
  groupKey: string;
  groupLabel: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: string;
}

export default function MyGroupsPage() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myRequests, setMyRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const userGroupKeys = (session as any)?.userGroupKeys || [];

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      const [groupsRes, requestsRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/my-access-requests')
      ]);

      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setGroups(data.groups || []);
      }

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setMyRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (group: Group) => {
    try {
      const response = await fetch('/api/admin/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupKey: group.key,
          groupLabel: group.label,
        }),
      });

      if (response.ok) {
        await fetchData();
        setShowRequestModal(false);
        setSelectedGroup(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to request access');
      }
    } catch (error) {
      console.error('Error requesting access:', error);
      alert('Failed to request access');
    }
  };

  const getGroupColor = (colorTier: string) => {
    switch (colorTier) {
      case 'admin': return '#0073B9';
      case 'internal': return '#51B749';
      case 'other': return '#FEBA17';
      default: return '#16213D';
    }
  };

  const availableGroups = groups.filter(g => !userGroupKeys.includes(g.key));
  const pendingRequests = myRequests.filter(r => r.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--parchment)' }}>
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }}></div>
          <p className="mt-4" style={{ color: 'var(--ink-soft)' }}>Loading your groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" style={{ backgroundColor: 'var(--parchment)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8" style={{ color: 'var(--gold)' }} />
          <h1 className="text-4xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-alegreya)' }}>
            My Groups
          </h1>
        </div>
        <p style={{ color: 'var(--ink-soft)' }}>
          Manage your group memberships and request access to new groups
        </p>
      </div>

      {/* Current Groups */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5" style={{ color: 'var(--gold)' }} />
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-alegreya)' }}>
            Your Current Groups
          </h2>
        </div>

        {userGroupKeys.length === 0 ? (
          <div className="p-12 text-center rounded-xl" style={{ backgroundColor: 'var(--panel)', boxShadow: 'var(--shadow-sm)' }}>
            <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--ink-faint)' }} />
            <p style={{ color: 'var(--ink-soft)' }}>You are not a member of any groups yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--ink-faint)' }}>Request access to groups below to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.filter(g => userGroupKeys.includes(g.key)).map((group) => (
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
                    className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide flex items-center gap-1"
                    style={{ backgroundColor: 'rgba(81, 183, 73, 0.1)', color: 'var(--color-internal)' }}
                  >
                    <Check className="w-3 h-3" />
                    Member
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)', fontFamily: 'var(--font-alegreya)' }}>
                  {group.label}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                  {group.key}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5" style={{ color: 'var(--gold)' }} />
            <h2 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-alegreya)' }}>
              Pending Requests
            </h2>
          </div>

          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="p-6 rounded-xl flex items-center justify-between"
                style={{ backgroundColor: 'var(--panel)', boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(209, 155, 60, 0.1)' }}
                  >
                    <Clock className="w-6 h-6" style={{ color: 'var(--gold)' }} />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--ink)' }}>{request.groupLabel}</p>
                    <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
                      Requested on {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className="px-4 py-2 rounded-full text-sm font-medium"
                  style={{ backgroundColor: 'rgba(209, 155, 60, 0.1)', color: 'var(--gold)' }}
                >
                  Pending Approval
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Groups */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Plus className="w-5 h-5" style={{ color: 'var(--gold)' }} />
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-alegreya)' }}>
            Request Access to Groups
          </h2>
        </div>

        {availableGroups.length === 0 ? (
          <div className="p-12 text-center rounded-xl" style={{ backgroundColor: 'var(--panel)', boxShadow: 'var(--shadow-sm)' }}>
            <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--ink-faint)' }} />
            <p style={{ color: 'var(--ink-soft)' }}>You are a member of all available groups</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableGroups.map((group) => {
              const hasPendingRequest = pendingRequests.some(r => r.groupKey === group.key);
              return (
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
                  {hasPendingRequest ? (
                    <Button
                      disabled
                      className="w-full"
                      style={{ backgroundColor: 'var(--parchment)', color: 'var(--ink-faint)', cursor: 'not-allowed' }}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Request Pending
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedGroup(group);
                        setShowRequestModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2"
                      style={{ backgroundColor: 'var(--gold)', color: 'var(--ink)' }}
                    >
                      <Plus className="w-4 h-4" />
                      Request Access
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Confirmation Modal */}
      {showRequestModal && selectedGroup && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(22, 33, 61, 0.5)' }}>
          <div className="p-8 rounded-xl max-w-md w-full mx-4" style={{ backgroundColor: 'var(--panel)' }}>
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--ink)', fontFamily: 'var(--font-alegreya)' }}>
              Request Access to {selectedGroup.label}
            </h3>
            <p className="mb-6" style={{ color: 'var(--ink-soft)' }}>
              You are requesting to join the <strong>{selectedGroup.label}</strong> group. An administrator will review your request and approve/deny it.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => handleRequestAccess(selectedGroup)}
                className="flex-1 flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--gold)', color: 'var(--ink)' }}
              >
                <Plus className="w-4 h-4" />
                Confirm Request
              </Button>
              <Button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedGroup(null);
                }}
                variant="outline"
                className="flex-1"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
