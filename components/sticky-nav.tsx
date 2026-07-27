'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Icon } from './icon-sprite';

export function StickyNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 h-[78px] backdrop-blur-[10px] border-b" style={{ backgroundColor: 'rgba(251, 246, 236, 0.9)', borderColor: 'var(--line)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="var(--ink)" strokeWidth="2" />
              <circle cx="20" cy="20" r="12" stroke="var(--gold)" strokeWidth="1.5" />
              <circle cx="20" cy="20" r="6" stroke="var(--ink)" strokeWidth="1.5" />
              <path d="M20 14c1.5 0 2.5 1 2.5 2.5s-1 2.5-2.5 2.5-2.5-1-2.5-2.5 1-2.5 2.5-2.5z" fill="var(--banyan)" />
              <path d="M20 18l2 4h-4l2-4z" fill="var(--banyan)" />
            </svg>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight" style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--ink)' }}>
                The Gurukulam School
              </span>
              <span className="text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-ibm-plex-mono)', color: 'var(--ink-faint)' }}>
                SCHOOL PORTAL
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/" className="text-sm font-medium transition-colors hover:text-[var(--gold)]" style={{ color: 'var(--ink)', borderBottom: isActive('/') ? '2px solid var(--gold)' : 'none' }}>
              Home
            </a>
            <a href="/schools" className="text-sm font-medium transition-colors hover:text-[var(--gold)]" style={{ color: 'var(--ink)', borderBottom: isActive('/schools') ? '2px solid var(--gold)' : 'none' }}>
              Schools
            </a>
            <a href="/documents" className="text-sm font-medium transition-colors hover:text-[var(--gold)]" style={{ color: 'var(--ink)', borderBottom: isActive('/documents') ? '2px solid var(--gold)' : 'none' }}>
              Documents
            </a>
            <a href="/cbse-rules" className="text-sm font-medium transition-colors hover:text-[var(--gold)]" style={{ color: 'var(--ink)', borderBottom: isActive('/cbse-rules') ? '2px solid var(--gold)' : 'none' }}>
              Rules & Compliance
            </a>
            {session && (session as any).userGroupKeys && (session as any).userGroupKeys.includes('admin-central') && (
              <a href="/admin/users" className="text-sm font-medium transition-colors hover:text-[var(--gold)]" style={{ color: 'var(--ink)', borderBottom: isActive('/admin') ? '2px solid var(--gold)' : 'none' }}>
                Admin
              </a>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-[var(--line-soft)] transition-colors" aria-label="Search">
              <Icon name="search" className="w-5 h-5" style={{ color: 'var(--ink)' }} />
            </button>
            {session ? (
              <a href="/api/auth/signout" className="hidden sm:inline-flex btn-outline text-sm">
                Sign Out
              </a>
            ) : (
              <a href="/login" className="hidden sm:inline-flex btn-outline text-sm">
                Staff Login
              </a>
            )}
            <button
              className="md:hidden p-2 rounded-full hover:bg-[var(--line-soft)] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <Icon name={mobileMenuOpen ? 'close' : 'menu'} className="w-6 h-6" style={{ color: 'var(--ink)' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 pt-[78px]" style={{ backgroundColor: 'var(--parchment)' }}>
          <div className="flex flex-col p-6 gap-4">
            <a href="/" className="text-lg font-medium py-2 border-b" style={{ color: 'var(--ink)', borderColor: 'var(--line)', borderBottom: isActive('/') ? '2px solid var(--gold)' : '1px solid var(--line)' }}>
              Home
            </a>
            <a href="/schools" className="text-lg font-medium py-2 border-b" style={{ color: 'var(--ink)', borderColor: 'var(--line)', borderBottom: isActive('/schools') ? '2px solid var(--gold)' : '1px solid var(--line)' }}>
              Schools
            </a>
            <a href="/documents" className="text-lg font-medium py-2 border-b" style={{ color: 'var(--ink)', borderColor: 'var(--line)', borderBottom: isActive('/documents') ? '2px solid var(--gold)' : '1px solid var(--line)' }}>
              Documents
            </a>
            <a href="/cbse-rules" className="text-lg font-medium py-2 border-b" style={{ color: 'var(--ink)', borderColor: 'var(--line)', borderBottom: isActive('/cbse-rules') ? '2px solid var(--gold)' : '1px solid var(--line)' }}>
              Rules & Compliance
            </a>
            {session && (session as any).userGroupKeys && (session as any).userGroupKeys.includes('admin-central') && (
              <a href="/admin/users" className="text-lg font-medium py-2 border-b" style={{ color: 'var(--ink)', borderColor: 'var(--line)', borderBottom: isActive('/admin') ? '2px solid var(--gold)' : '1px solid var(--line)' }}>
                Admin
              </a>
            )}
            {session ? (
              <a href="/api/auth/signout" className="btn-gold text-center mt-4">
                Sign Out
              </a>
            ) : (
              <a href="/login" className="btn-gold text-center mt-4">
                Staff Login
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
