'use client';

import { useEffect, useRef } from 'react';
import { Icon } from './icon-sprite';

export function DarkCTABand() {
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
    <section ref={sectionRef} className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundColor: 'var(--ink)' }}>
      {/* Decorative Background Rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-10">
          <svg viewBox="0 0 600 600" fill="none">
            <circle cx="300" cy="300" r="280" stroke="var(--gold)" strokeWidth="1" />
            <circle cx="300" cy="300" r="220" stroke="var(--gold)" strokeWidth="0.5" />
            <circle cx="300" cy="300" r="160" stroke="var(--gold)" strokeWidth="0.5" />
            <circle cx="300" cy="300" r="100" stroke="var(--gold)" strokeWidth="0.5" />
          </svg>
        </div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="reveal">
          <span className="eyebrow justify-center" style={{ color: 'var(--gold)' }}>
            Excellence in Education
          </span>
          
          <h2 className="text-3xl md:text-5xl mt-6 mb-6" style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--parchment)' }}>
            Empowering Minds, Shaping Futures
          </h2>
          
          <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: 'rgba(251, 246, 236, 0.7)', lineHeight: '1.6' }}>
            The Gurukulam School network is committed to providing exceptional education and a nurturing environment for students across India.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/schools" className="btn-gold">
              Explore Schools
              <Icon name="arrow-right" className="w-4 h-4" />
            </a>
            <a href="/documents" className="btn-outline-light">
              Learn More
              <Icon name="arrow-up-right" className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
