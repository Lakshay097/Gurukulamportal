'use client';

import { useEffect, useRef } from 'react';
import { Icon } from './icon-sprite';

const valueProps = [
  {
    icon: 'star',
    title: 'Academic Excellence',
    description: 'Our curriculum is designed to foster <em>critical thinking</em> and creativity, preparing students for success in an evolving world.'
  },
  {
    icon: 'users',
    title: 'Community Focus',
    description: 'We believe in building strong relationships between <em>students, teachers, and families</em> to create a supportive learning environment.'
  },
  {
    icon: 'heart',
    title: 'Holistic Development',
    description: 'Beyond academics, we nurture <em>character, values, and life skills</em> that help students become well-rounded individuals.'
  }
];

export function WhyUsSection() {
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
    <section ref={sectionRef} className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--parchment)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-12 reveal">
          <div>
            <span className="eyebrow">Why Choose Us</span>
            <h2 className="text-3xl md:text-4xl mt-3" style={{ color: 'var(--ink)' }}>
              The TGS Difference
            </h2>
          </div>
          <p className="max-w-md text-sm" style={{ color: 'var(--ink-soft)', lineHeight: '1.6' }}>
            Discover what sets The Gurukulam School apart in our commitment to educational excellence and student success.
          </p>
        </div>

        {/* Card Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {valueProps.map((item, index) => (
            <div
              key={index}
              className="reveal"
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <div 
                className="rounded-xl p-8 h-full border transition-all duration-300 hover:shadow-lg"
                style={{ 
                  backgroundColor: 'var(--panel)', 
                  borderRadius: 'var(--r-md)',
                  borderColor: 'var(--line)'
                }}
              >
                {/* Icon Badge */}
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
                  style={{ backgroundColor: 'var(--parchment-deep)' }}
                >
                  <Icon name={item.icon} className="w-7 h-7" style={{ color: 'var(--terracotta)' }} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-alegreya)', color: 'var(--ink)' }}>
                  {item.title}
                </h3>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--ink-soft)' }}
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
