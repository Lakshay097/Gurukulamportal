import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - The Gurukulam School',
  description: 'Terms of Service for The Gurukulam School Portal',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0F192F' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8" style={{ color: 'var(--parchment)', fontFamily: 'var(--font-alegreya)' }}>
          Terms of Service
        </h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-lg mb-6" style={{ color: 'rgba(251, 246, 236, 0.8)' }}>
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--gold)' }}>
              1. Acceptance of Terms
            </h2>
            <p className="mb-4" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              By accessing and using The Gurukulam School Portal, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--gold)' }}>
              2. User Responsibilities
            </h2>
            <p className="mb-4" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              As a user of the Gurukulam School Portal, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              <li>Provide accurate and complete information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Use the portal only for educational and administrative purposes</li>
              <li>Respect the privacy and rights of other users</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not attempt to gain unauthorized access to any portion of the portal</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--gold)' }}>
              3. Intellectual Property
            </h2>
            <p className="mb-4" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              All content, including documents, materials, and intellectual property available on the Gurukulam School Portal, is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without explicit permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--gold)' }}>
              4. Privacy and Data Protection
            </h2>
            <p className="mb-4" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              Your use of the Gurukulam School Portal is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs the portal and informs users of our data collection practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--gold)' }}>
              5. Termination of Service
            </h2>
            <p className="mb-4" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              We reserve the right to terminate or suspend your access to the Gurukulam School Portal at our sole discretion, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--gold)' }}>
              6. Limitation of Liability
            </h2>
            <p className="mb-4" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              The Gurukulam School shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--gold)' }}>
              7. Changes to Terms
            </h2>
            <p className="mb-4" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page. Your continued use of the portal after such modifications constitutes your acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--gold)' }}>
              8. Contact Information
            </h2>
            <p className="mb-4" style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p style={{ color: 'rgba(251, 246, 236, 0.7)' }}>
              Email: legal@gurukulam.edu<br />
              Phone: +91 1800-XXX-XXXX
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
