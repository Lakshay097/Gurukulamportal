'use client';

import { useEffect, useRef } from 'react';
import { Icon } from './icon-sprite';
import { SCHOOL_WEBSITES } from '@/lib/constants';

const locations = [
  {
    state: 'Madhya Pradesh',
    city: 'Jaipur',
    gradient: 'linear-gradient(135deg, #D89B3C 0%, #B87A1F 100%)',
    image: '/images/Jaipur.jfif',
    slug: 'jaipur'
  },
  {
    state: 'Madhya Pradesh',
    city: 'Gwalior',
    gradient: 'linear-gradient(135deg, #C1592B 0%, #A04820 100%)',
    image: '/images/Gwalior.png',
    slug: 'gwalior'
  },
  {
    state: 'Madhya Pradesh',
    city: 'Bhopal',
    gradient: 'linear-gradient(135deg, #4B6B44 0%, #3A5535 100%)',
    image: '/images/Bhopal.jfif',
    slug: 'bhopal'
  }
];

export function NetworkSection() {
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
    <section ref={sectionRef} className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--parchment-deep)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-12 reveal">
          <div>
            <span className="eyebrow">Our Network</span>
            <h2 className="text-3xl md:text-4xl mt-3" style={{ color: 'var(--ink)' }}>
              Schools Across India
            </h2>
          </div>
          <p className="max-w-md text-sm" style={{ color: 'var(--ink-soft)', lineHeight: '1.6' }}>
            Discover our growing network of educational institutions, each committed to excellence and holistic development.
          </p>
        </div>

        {/* Card Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Location Cards */}
          {locations.map((location, index) => (
            <a
              key={index}
              href={SCHOOL_WEBSITES[location.slug] || `/schools/${location.slug}`}
              target={SCHOOL_WEBSITES[location.slug] ? '_blank' : '_self'}
              rel={SCHOOL_WEBSITES[location.slug] ? 'noopener noreferrer' : undefined}
              className="group reveal"
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <div 
                className="rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-[6px] hover:shadow-xl"
                style={{ backgroundColor: 'var(--panel)', borderRadius: 'var(--r-md)' }}
              >
                {/* Image Block */}
                <div className="relative h-48 overflow-hidden">
                  <div 
                    className="absolute inset-0 opacity-90"
                    style={{ background: location.gradient }}
                  />
                  <img
                    src={location.image}
                    alt={location.city}
                    className="w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Location Badge */}
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" 
                       style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}>
                    <Icon name="map-pin" className="w-4 h-4" style={{ color: 'var(--ink)' }} />
                  </div>

                  {/* Decorative Ring */}
                  <div className="absolute bottom-3 left-3 w-16 h-16 opacity-20">
                    <svg viewBox="0 0 64 64" fill="none">
                      <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="1" />
                      <circle cx="32" cy="32" r="20" stroke="white" strokeWidth="0.5" />
                    </svg>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <span className="text-xs uppercase tracking-wider font-medium" 
                        style={{ fontFamily: 'var(--font-ibm-plex-mono)', color: 'var(--ink-faint)' }}>
                    {location.state}
                  </span>
                  <h3 className="text-lg font-semibold mt-1 mb-3 group-hover:text-[var(--gold)] transition-colors" 
                      style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--ink)' }}>
                    {location.city}
                  </h3>
                  <span className="link-arrow text-sm font-medium">
                    View School
                    <Icon name="arrow-right" className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </a>
          ))}

          {/* View All Card */}
          <div className="reveal" style={{ transitionDelay: '0.3s' }}>
            <div 
              className="rounded-xl p-6 h-full flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-[6px] hover:shadow-xl border-2 border-dashed"
              style={{ 
                backgroundColor: 'var(--panel)', 
                borderRadius: 'var(--r-md)',
                borderColor: 'var(--line)'
              }}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--parchment-deep)' }}
              >
                <Icon name="grid" className="w-6 h-6" style={{ color: 'var(--gold)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--ink)' }}>
                View All Schools
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--ink-soft)', lineHeight: '1.5' }}>
                Explore our complete network of 12+ branches across multiple states.
              </p>
              <a href="/schools" className="link-arrow text-sm font-medium">
                Browse Directory
                <Icon name="arrow-right" className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
