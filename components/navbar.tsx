'use client';

import Link from 'next/link';
import { Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import RoleBadge from './role-badge';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/images/logo.png" alt="The Gurukulam School" className="h-12 w-auto" />
              <span className="font-heading text-xl font-bold text-gray-900">The Gurukulam School</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link href="/" className="text-gray-700 hover:text-gray-900">
              Home
            </Link>
            
            <Link href="/schools" className="text-gray-700 hover:text-gray-900">
              Schools
            </Link>
            <Link href="/documents" className="text-gray-700 hover:text-gray-900">
              Documents
            </Link>

            <Link href="/cbse-rules" className="text-gray-700 hover:text-gray-900">
              CBSE Rules
            </Link>
            {session && (session as any).userGroupKeys && (session as any).userGroupKeys.includes('admin-central') && (
              <Link href="/admin/users" className="text-gray-700 hover:text-gray-900">
                Admin
              </Link>
            )}
          </div>

          {/* Right side: Search and Role Badge */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <button className="text-gray-500 hover:text-gray-700">
              <Search className="h-5 w-5" />
            </button>
            {session && (session as any).userGroupKeys && (session as any).userGroupKeys.length > 0 && (
              <RoleBadge colorTier={(session as any).userGroupKeys.includes('admin-central') ? 'admin' : (session as any).userGroupKeys.includes('internal-staff') ? 'internal' : 'other'} />
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="space-y-1 px-4 py-3">
            <Link href="/" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">
              Home
            </Link>
            <Link href="/schools" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">
              Schools
            </Link>
            <Link href="/documents" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">
              Documents
            </Link>
            <Link href="/cbse-rules" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">
              CBSE Rules
            </Link>
            {session && (session as any).userGroupKeys && (session as any).userGroupKeys.includes('admin-central') && (
              <Link href="/admin/users" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">
                Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
