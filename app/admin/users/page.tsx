"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Group {
  id: string;
  key: string;
  label: string;
  colorTier: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  groups: string[];
  createdAt: any;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setGroups(data.groups);
        
        // Initialize selected groups for each user
        const initialSelected: Record<string, string[]> = {};
        data.users.forEach((user: User) => {
          initialSelected[user.id] = user.groups || [];
        });
        setSelectedGroups(initialSelected);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupToggle = (userId: string, groupId: string) => {
    setSelectedGroups((prev) => {
      const currentGroups = prev[userId] || [];
      const newGroups = currentGroups.includes(groupId)
        ? currentGroups.filter((id) => id !== groupId)
        : [...currentGroups, groupId];
      return { ...prev, [userId]: newGroups };
    });
  };

  const handleSaveUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          groupIds: selectedGroups[userId] || [],
        }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating user groups:', error);
    }
  };

  const getGroupLabel = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group?.label || groupId;
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Users</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left font-semibold">Email</th>
              <th className="border px-4 py-2 text-left font-semibold">Name</th>
              <th className="border px-4 py-2 text-left font-semibold">Groups</th>
              <th className="border px-4 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border px-4 py-2">{user.email}</td>
                <td className="border px-4 py-2">{user.name || '-'}</td>
                <td className="border px-4 py-2">
                  <div className="flex flex-wrap gap-2">
                    {groups.map((group) => (
                      <label key={group.id} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(selectedGroups[user.id] || []).includes(group.id)}
                          onChange={() => handleGroupToggle(user.id, group.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{group.label}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td className="border px-4 py-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveUser(user.id)}
                  >
                    Save
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
