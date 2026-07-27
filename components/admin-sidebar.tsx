'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Shield, Building } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/admin/users',
      label: 'Users',
      icon: Users,
      description: 'Manage user accounts and groups',
    },
    {
      href: '/admin/permissions',
      label: 'Permissions',
      icon: Shield,
      description: 'Configure access control rules',
    },
    {
      href: '/admin/schools',
      label: 'Schools',
      icon: Building,
      description: 'Manage school information',
    },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <p className="text-gray-400 text-sm mt-1">System Management</p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-xs opacity-70">{item.description}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-6 border-t border-gray-700">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Portal</span>
        </Link>
      </div>
    </aside>
  );
}
