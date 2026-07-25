import { HeroSection } from '@/components/hero-section';
import { QuickAccessPanel } from '@/components/quick-access-panel';
import { NetworkSection } from '@/components/network-section';
import { WhyUsSection } from '@/components/why-us-section';
import { DarkCTABand } from '@/components/dark-cta-band';
import { Footer } from '@/components/footer';
import { IconSprite } from '@/components/icon-sprite';

export default function Home() {
  return (
    <main style={{ backgroundColor: 'var(--parchment)' }}>
      <IconSprite />
      <HeroSection />
      <QuickAccessPanel />
      <NetworkSection />
      <WhyUsSection />
      <DarkCTABand />
      <Footer />
    </main>
  );
}