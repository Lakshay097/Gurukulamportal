'use client';

import { Icon } from './icon-sprite';

const footerLinks = {
  portal: [
    { label: 'Home', href: '/' },
    { label: 'Schools', href: '/schools' },
    { label: 'Documents', href: '/documents' },
    { label: 'Compliance', href: '/cbse-rules' },
  ],
  network: [
    { label: 'All Schools', href: '/schools' },
    { label: 'Admissions', href: '/schools' },
    { label: 'Careers', href: '/schools' },
    { label: 'News & Events', href: '/schools' },
  ],
  contact: [
    { label: 'Contact Us', href: '/schools' },
    { label: 'Support', href: '/schools' },
    { label: 'FAQ', href: '/schools' },
    { label: 'Feedback', href: '/schools' },
  ]
};

export function Footer() {
  return (
    <footer className="pt-16 pb-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0F192F' }}>
      <div className="max-w-7xl mx-auto">
        {/* Top Border */}
        <div className="mb-12" style={{ borderTop: '1px solid rgba(251, 246, 236, 0.1)' }} />

        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="rgba(251, 246, 236, 0.6)" strokeWidth="2" />
                <circle cx="20" cy="20" r="12" stroke="var(--gold)" strokeWidth="1.5" />
                <circle cx="20" cy="20" r="6" stroke="rgba(251, 246, 236, 0.6)" strokeWidth="1.5" />
                <path d="M20 14c1.5 0 2.5 1 2.5 2.5s-1 2.5-2.5 2.5-2.5-1-2.5-2.5 1-2.5 2.5-2.5z" fill="var(--banyan)" />
                <path d="M20 18l2 4h-4l2-4z" fill="var(--banyan)" />
              </svg>
              <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--parchment)' }}>
                The Gurukulam School
              </span>
            </div>
            <p className="text-sm mb-6" style={{ color: 'rgba(251, 246, 236, 0.6)', lineHeight: '1.6' }}>
              Empowering education across India through centralized knowledge management and collaborative excellence.
            </p>
          </div>

          {/* Portal Links */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold mb-4" 
                style={{ fontFamily: 'var(--font-ibm-plex-mono)', color: 'var(--gold)' }}>
              Portal
            </h4>
            <ul className="space-y-3">
              {footerLinks.portal.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm transition-colors hover:text-[var(--gold)]" 
                     style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Network Links */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold mb-4" 
                style={{ fontFamily: 'var(--font-ibm-plex-mono)', color: 'var(--gold)' }}>
              Network
            </h4>
            <ul className="space-y-3">
              {footerLinks.network.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm transition-colors hover:text-[var(--gold)]" 
                     style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold mb-4" 
                style={{ fontFamily: 'var(--font-ibm-plex-mono)', color: 'var(--gold)' }}>
              Contact
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Icon name="mail" className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                <a href="mailto:info@gurukulam.edu" className="text-sm transition-colors hover:text-[var(--gold)]" 
                   style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
                  info@gurukulam.edu
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="phone" className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                <span className="text-sm" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
                  +91 1800-XXX-XXXX
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="map-pin" className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                <span className="text-sm" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
                  Multiple locations across India
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-8" 
             style={{ borderTop: '1px solid rgba(251, 246, 236, 0.1)' }}>
          <p className="text-xs" style={{ color: 'rgba(251, 246, 236, 0.5)' }}>
            © 2024 The Gurukulam School. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: 'rgba(251, 246, 236, 0.5)' }}>
            Empowering Minds, Shaping Futures
          </p>
        </div>
      </div>
    </footer>
  );
}
