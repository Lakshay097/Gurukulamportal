import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HeroSection } from '@/components/hero-section';
import { HomeContentSection } from '@/components/home-content-section';
import { NetworkSection } from '@/components/network-section';
import { WhyUsSection } from '@/components/why-us-section';
import { DarkCTABand } from '@/components/dark-cta-band';
import { Footer } from '@/components/footer';

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