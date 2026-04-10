import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How hirebridge collects, uses, and protects your personal data.',
  alternates: { canonical: '/privacy' },
};

const LAST_UPDATED = 'April 2025';

export default function PrivacyPage() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-4 block">
            Legal
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl text-primary mb-4">
            Privacy <em>Policy</em>
          </h1>
          <p className="text-sm text-text-muted">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-bg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 sm:p-12 flex flex-col gap-10 text-text-main">

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Overview</h2>
              <p className="text-sm leading-relaxed text-text-muted">
                hirebridge is a no-signup jobs platform connecting employers and candidates. We are
                committed to handling your personal data responsibly. This policy explains what we
                collect, how we use it, and your rights.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">What we collect</h2>
              <p className="text-sm leading-relaxed text-text-muted mb-4">
                We only collect what is necessary to operate the platform:
              </p>
              <div className="flex flex-col gap-4">
                <div className="bg-surface rounded-xl p-5">
                  <p className="text-sm font-semibold text-text-main mb-1">When you post a job</p>
                  <p className="text-sm text-text-muted">Your email address (for verification and listing management), company name, job details, and contact information shown to applicants.</p>
                </div>
                <div className="bg-surface rounded-xl p-5">
                  <p className="text-sm font-semibold text-text-main mb-1">When you create a profile</p>
                  <p className="text-sm text-text-muted">Your name, email address, contact number, current city and country, professional title, experience, skills, LinkedIn URL (optional), and resume PDF (optional).</p>
                </div>
                <div className="bg-surface rounded-xl p-5">
                  <p className="text-sm font-semibold text-text-main mb-1">Technical data</p>
                  <p className="text-sm text-text-muted">IP address (used for rate limiting to prevent spam). We do not use tracking cookies or analytics.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">How we use your data</h2>
              <ul className="flex flex-col gap-2 text-sm text-text-muted list-disc list-inside">
                <li>To send a one-time email verification link when you create a listing.</li>
                <li>To send your management link so you can edit or remove your listing.</li>
                <li>To display your listing publicly on hirebridge (your email is never shown publicly).</li>
                <li>To store your resume securely and make it available for download by employers who view your profile.</li>
                <li>To enforce rate limits and prevent spam submissions.</li>
              </ul>
              <p className="text-sm text-text-muted mt-4">
                We do not use your data for advertising, profiling, or any purpose beyond operating the platform. We never sell or share your personal data with third parties for marketing.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Third-party services</h2>
              <p className="text-sm leading-relaxed text-text-muted">
                We use trusted third-party providers for email delivery, file storage, and hosting. These providers only process your data to the extent necessary to operate the platform, and are bound by their own privacy policies. We do not share your personal data with any third party for marketing or advertising purposes.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Data retention</h2>
              <p className="text-sm leading-relaxed text-text-muted">
                Job listings are active for 60 days and candidate profiles for 180 days, after which they expire automatically. You can remove your listing at any time using the management link sent to your email. When a listing is removed or expires, it is hidden from public view. We may retain minimal records (email address, creation date) for abuse prevention for up to 12 months.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Your rights</h2>
              <p className="text-sm leading-relaxed text-text-muted mb-3">
                You have the right to:
              </p>
              <ul className="flex flex-col gap-2 text-sm text-text-muted list-disc list-inside">
                <li>Remove your listing at any time via your management link.</li>
                <li>Request deletion of your personal data by contacting us.</li>
                <li>Request a copy of the data we hold about you.</li>
              </ul>
              <p className="text-sm text-text-muted mt-3">
                To exercise these rights, contact us at the address on our{' '}
                <a href="/contact" className="text-secondary hover:underline">Contact page</a>.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Cookies</h2>
              <p className="text-sm leading-relaxed text-text-muted">
                hirebridge does not use tracking cookies or analytics cookies. We use browser{' '}
                <code className="bg-surface px-1.5 py-0.5 rounded text-xs font-mono">localStorage</code>{' '}
                to save bookmarks locally on your device — this data never leaves your browser.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Changes to this policy</h2>
              <p className="text-sm leading-relaxed text-text-muted">
                We may update this policy from time to time. The date at the top of this page will reflect the most recent update. Continued use of hirebridge after changes constitutes acceptance of the updated policy.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Contact</h2>
              <p className="text-sm leading-relaxed text-text-muted">
                For privacy-related questions or data requests, please reach out via our{' '}
                <a href="/contact" className="text-secondary hover:underline">Contact page</a>.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
