'use client';

import { useEffect, useRef } from 'react';
import { Icon } from './icon-sprite';
import Image from 'next/image';

export function HeroSection() {
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
    <section ref={sectionRef} className="relative pt-16 pb-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--parchment)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[55%_45%] gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-8 reveal">
            <span className="eyebrow">Welcome to TGS</span>
            
            <h1 className="text-[clamp(2.3rem,4vw,3.65rem)] leading-[1.1]" style={{ color: 'var(--ink)' }}>
              Empowering Minds,
              <br />
              <em style={{ color: 'var(--terracotta)' }}>Shaping Futures</em>
              <br />
              Across India
            </h1>
            
            <p className="text-lg max-w-[46ch]" style={{ color: 'var(--ink-soft)', lineHeight: '1.6' }}>
              The Gurukulam School network brings world-class education to communities across India, fostering excellence through innovative learning and holistic development.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <a href="/schools" className="btn-gold">
                Explore Schools
                <Icon name="arrow-right" className="w-4 h-4" />
              </a>
              <a href="/documents" className="btn-outline">
                Learn More
                <Icon name="arrow-up-right" className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right Column - Hero Banner Image */}
          <div className="relative reveal" style={{ transitionDelay: '0.2s' }}>
            {/* Decorative Rings */}
            <div className="absolute -top-8 -right-8 w-64 h-64 pointer-events-none opacity-20">
              <svg viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="45" stroke="var(--gold)" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="35" stroke="var(--terracotta)" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="25" stroke="var(--banyan)" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="15" stroke="var(--ink)" strokeWidth="0.5" />
              </svg>
            </div>

            {/* Hero Banner Image - Replace with your actual image */}
            <div className="relative" style={{ borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
              <Image
                src="/images/Banner.webp"
                alt="The Gurukulam School Campus"
                width={500}
                height={625}
                className="w-full h-auto object-cover"
                style={{ maxHeight: '500px' }}
                priority
              />
              {/* Optional overlay label */}
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full text-xs font-medium" 
                   style={{ backgroundColor: 'rgba(251, 246, 236, 0.95)', color: 'var(--ink)', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                MAIN CAMPUS
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
