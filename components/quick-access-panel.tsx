'use client';

import { useEffect, useRef } from 'react';
import { Icon } from './icon-sprite';

const quickAccessItems = [
  {
    icon: 'school',
    title: 'School Directory',
    description: 'Explore our network of schools across India with detailed information about each campus.',
    link: '/schools'
  },
  {
    icon: 'document',
    title: 'Document Repository',
    description: 'Access SOPs, policies, agreements, and essential documents for staff and administration.',
    link: '/documents'
  },
  {
    icon: 'book',
    title: 'CBSE Compliance',
    description: 'Stay updated with CBSE regulations, compliance guidelines, and educational standards.',
    link: '/cbse-rules'
  }
];

export function QuickAccessPanel() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const reveals = sectionRef.current?.querySelectorAll('.reveal');
    reveals?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative -mt-16 px-4 sm:px-6 lg:px-8 mb-20">
      <div className="max-w-7xl mx-auto">
        <div 
          className="rounded-2xl p-8 shadow-lg reveal"
          style={{ 
            backgroundColor: 'var(--panel)', 
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div className="grid md:grid-cols-3 gap-0">
            {quickAccessItems.map((item, index) => (
              <div
                key={index}
                className={`p-6 transition-all duration-200 hover:bg-[rgba(216,155,60,0.05)] ${
                  index < quickAccessItems.length - 1 ? 'md:border-r' : ''
                }`}
                style={{ borderColor: 'var(--line)' }}
              >
                {/* Icon Tile */}
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--parchment-deep)' }}
                >
                  <Icon name={item.icon} className="w-6 h-6" style={{ color: 'var(--terracotta)' }} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--ink)' }}>
                  {item.title}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--ink-soft)', lineHeight: '1.5' }}>
                  {item.description}
                </p>

                {/* Arrow Link */}
                <a href={item.link} className="link-arrow text-sm font-medium">
                  Access
                  <Icon name="arrow-right" className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>

          {/* Mobile horizontal dividers */}
          <div className="md:hidden">
            {quickAccessItems.slice(0, -1).map((_, index) => (
              <div 
                key={index}
                className="my-4"
                style={{ borderTop: '1px solid var(--line)' }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
