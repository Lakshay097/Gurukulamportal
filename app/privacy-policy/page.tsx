import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - The Gurukulam School',
  description: 'Privacy Policy for The Gurukulam School Portal',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0F192F' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8" style={{ color: 'var(--parchment)', fontFamily: 'var(--font-alegreya)' }}>
          Privacy Policy
        </h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-lg mb-6" style={{ color: 'rgba(251, 246, 236, 0.8)' }}>
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--gold)' }}>
              1. Information We Collect
            </h2>
            <p className="mb-4" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              The Gurukulam School Portal collects information to provide better services to all our users. This includes:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              <li>Personal identification information (Name, email address, contact details)</li>
              <li>School affiliation and role information</li>
              <li>Document access and usage data</li>
              <li>Technical data (IP address, browser type, device information)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--gold)' }}>
              2. How We Use Your Information
            </h2>
            <p className="mb-4" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              We use the collected information for various purposes:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              <li>To provide and maintain our educational portal services</li>
              <li>To notify you about changes to our services</li>
              <li>To allow you to participate in interactive features of our portal</li>
              <li>To provide customer support and respond to inquiries</li>
              <li>To monitor and analyze usage patterns to improve our services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--gold)' }}>
              3. Data Security
            </h2>
            <p className="mb-4" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--gold)' }}>
              4. Your Privacy Rights
            </h2>
            <p className="mb-4" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              You have the right to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              <li>Access and review your personal data</li>
              <li>Request correction or deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--gold)' }}>
              5. Contact Us
            </h2>
            <p className="mb-4" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              Email: privacy@gurukulam.edu<br />
              Phone: +91 1800-XXX-XXXX
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
