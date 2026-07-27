import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dynamic from 'next/dynamic';

// Dynamically import client components for better code splitting
const HeroSection = dynamic(() => import('@/components/hero-section').then(mod => ({ default: mod.HeroSection })), {
  loading: () => <div className="h-[500px] animate-pulse" style={{ backgroundColor: 'var(--parchment)' }} />,
  ssr: true
});

const HomeContentSection = dynamic(() => import('@/components/home-content-section').then(mod => ({ default: mod.HomeContentSection })), {
  ssr: true
});

const NetworkSection = dynamic(() => import('@/components/network-section').then(mod => ({ default: mod.NetworkSection })), {
  loading: () => <div className="h-[400px] animate-pulse" style={{ backgroundColor: 'var(--parchment-deep)' }} />,
  ssr: true
});

const WhyUsSection = dynamic(() => import('@/components/why-us-section').then(mod => ({ default: mod.WhyUsSection })), {
  loading: () => <div className="h-[300px] animate-pulse" style={{ backgroundColor: 'var(--parchment)' }} />,
  ssr: true
});

const DarkCTABand = dynamic(() => import('@/components/dark-cta-band').then(mod => ({ default: mod.DarkCTABand })), {
  loading: () => <div className="h-[300px] animate-pulse" style={{ backgroundColor: 'var(--ink)' }} />,
  ssr: true
});

const Footer = dynamic(() => import('@/components/footer').then(mod => ({ default: mod.Footer })), {
  ssr: true
});

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <>
      <HeroSection />
      <HomeContentSection
        heading="About Our Network"
        body="The Gurukulam School network is committed to providing world-class education across India. Our schools follow standardized processes and share best practices to ensure consistent quality education for all students."
      />
      <NetworkSection />
      <WhyUsSection />
      <DarkCTABand />
      <Footer />
    </>
  );
}