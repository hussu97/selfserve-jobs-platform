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
                hirebridge is a talent-first jobs platform connecting employers, recruiters, and candidates across
                the UAE. We are committed to handling your personal data responsibly. This policy explains what we
                collect, how we use it, and your rights. The platform operates a dual model: talent profiles are
                friction-free (email verification only), while recruiters register for a verified account to access
                sensitive candidate data.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">What we collect</h2>
              <p className="text-sm leading-relaxed text-text-muted mb-4">
                We only collect what is necessary to operate the platform:
              </p>
              <div className="flex flex-col gap-4">
                <div className="bg-surface rounded-xl p-5">
                  <p className="text-sm font-semibold text-text-main mb-1">When you create a talent profile</p>
                  <p className="text-sm text-text-muted">Your name, email address, contact number, current city and country, professional title, experience, skills, LinkedIn URL (optional), and resume PDF (optional). Your email address is never displayed publicly.</p>
                </div>
                <div className="bg-surface rounded-xl p-5">
                  <p className="text-sm font-semibold text-text-main mb-1">When you register as a recruiter</p>
                  <p className="text-sm text-text-muted">Your name, company name, work email address, and LinkedIn profile URL. This information is stored for identity verification, admin review, and audit purposes. Recruiters are held accountable for how they handle talent data once approved.</p>
                </div>
                <div className="bg-surface rounded-xl p-5">
                  <p className="text-sm font-semibold text-text-main mb-1">When a recruiter posts a job</p>
                  <p className="text-sm text-text-muted">Job details and contact information shown to applicants, associated with the recruiter&apos;s verified account.</p>
                </div>
                <div className="bg-surface rounded-xl p-5">
                  <p className="text-sm font-semibold text-text-main mb-1">Technical data</p>
                  <p className="text-sm text-text-muted">IP address (used for rate limiting to prevent spam). We do not use tracking cookies or analytics.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Controlled access to sensitive talent data</h2>
              <p className="text-sm leading-relaxed text-text-muted mb-4">
                Sensitive talent data — including email address, phone number, and resume PDF — is only accessible
                to recruiters who have completed registration and received admin approval. Anonymous browsers can
                view public profile information (title, skills, location, bio) but cannot access contact details.
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                The admin approval process involves a manual review of the recruiter&apos;s submitted information
                to verify that they represent a legitimate hiring organisation. Approved recruiters are bound by
                our Terms of Service and may be suspended if they misuse talent contact data (e.g. unsolicited
                marketing, resale of data).
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">How we use your data</h2>
              <ul className="flex flex-col gap-2 text-sm text-text-muted list-disc list-inside">
                <li>To send a one-time email verification link when you create a talent profile.</li>
                <li>To send your management link so you can edit or remove your listing.</li>
                <li>To display your public profile information on hirebridge.</li>
                <li>To make sensitive contact details and resume available exclusively to approved recruiters.</li>
                <li>To review recruiter registration applications and maintain an audit trail of access.</li>
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
                Job listings are active for 60 days and candidate profiles for 180 days, after which they expire automatically. You can remove your listing at any time using the management link sent to your email. When a listing is removed or expires, it is hidden from public view. Recruiter account data is retained for as long as the account is active and for up to 12 months after suspension for audit purposes. We may retain minimal records (email address, creation date) for abuse prevention for up to 12 months.
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
                <li>As a recruiter, request closure of your account and deletion of associated data.</li>
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
