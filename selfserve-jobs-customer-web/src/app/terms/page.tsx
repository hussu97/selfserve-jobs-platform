import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The rules for using jobs4u — a free jobs platform for employers and candidates.',
};

const LAST_UPDATED = 'April 2025';

export default function TermsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-4 block">
            Legal
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl text-primary mb-4">
            Terms of <em>Service</em>
          </h1>
          <p className="text-sm text-text-muted">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-bg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-surface-lowest shadow-ambient rounded-2xl p-8 sm:p-12 flex flex-col gap-10 text-text-main">

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Acceptance</h2>
              <p className="text-sm leading-relaxed text-text-muted">
                By using jobs4u — whether to browse, post a job, or create a candidate profile — you agree to these Terms of Service. If you do not agree, please do not use the platform. We reserve the right to update these terms at any time; continued use constitutes acceptance.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">What jobs4u is</h2>
              <p className="text-sm leading-relaxed text-text-muted">
                jobs4u is a free, self-serve jobs board. We act as a neutral platform that displays listings submitted by users. We do not verify the accuracy of listings, do not act as a recruiter or employment agency, and are not a party to any hiring arrangement between employers and candidates.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Posting rules</h2>
              <p className="text-sm leading-relaxed text-text-muted mb-4">
                All listings must comply with the following:
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                  <p className="text-sm text-text-muted"><span className="font-medium text-text-main">Accuracy</span> — All information must be truthful and not misleading. Fake jobs, fake profiles, and impersonation are prohibited.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                  <p className="text-sm text-text-muted"><span className="font-medium text-text-main">No spam</span> — Duplicate listings, mass-posting, or automated submissions are prohibited. Maximum 5 active job listings and 2 active candidate profiles per email address.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                  <p className="text-sm text-text-muted"><span className="font-medium text-text-main">Legal content only</span> — No listings for illegal work, discriminatory roles, or content that violates applicable law.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                  <p className="text-sm text-text-muted"><span className="font-medium text-text-main">No harmful content</span> — No offensive, abusive, or otherwise inappropriate content in any listing field.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                  <p className="text-sm text-text-muted"><span className="font-medium text-text-main">Valid contact information</span> — You must provide a working email address you own. Third-party emails are not permitted.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Listing lifecycle</h2>
              <ul className="flex flex-col gap-2 text-sm text-text-muted list-disc list-inside">
                <li>Job listings are active for 60 days and candidate profiles for 90 days from the date of verification.</li>
                <li>After expiry, listings are hidden from public view automatically.</li>
                <li>You may remove your listing at any time using the management link sent to your email.</li>
                <li>Listings that receive 3 or more reports may be temporarily hidden pending review.</li>
                <li>We reserve the right to remove any listing that violates these terms without prior notice.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Resume uploads</h2>
              <p className="text-sm leading-relaxed text-text-muted">
                By uploading a resume, you confirm that it contains only your own information and that you consent to it being stored and made accessible to employers who view your profile. Resumes are stored securely and are not indexed by search engines. Do not upload documents containing third-party personal data or sensitive information beyond your own professional details.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Prohibited use</h2>
              <p className="text-sm leading-relaxed text-text-muted mb-4">
                You may not use jobs4u to:
              </p>
              <ul className="flex flex-col gap-2 text-sm text-text-muted list-disc list-inside">
                <li>Scrape, crawl, or systematically download content in bulk.</li>
                <li>Submit listings through automated scripts or bots.</li>
                <li>Collect personal information from other users&apos; listings for unsolicited outreach or marketing.</li>
                <li>Attempt to circumvent rate limits, verification, or any security measure.</li>
                <li>Post listings intended to defraud job seekers (e.g., advance-fee scams, false promises).</li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">No warranty</h2>
              <p className="text-sm leading-relaxed text-text-muted">
                jobs4u is provided &ldquo;as is&rdquo; without any warranty, express or implied. We do not guarantee the accuracy, completeness, or availability of any listing. We make no representations about the suitability of any job or candidate. Use the platform at your own risk.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Limitation of liability</h2>
              <p className="text-sm leading-relaxed text-text-muted">
                To the maximum extent permitted by law, jobs4u and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the platform, including but not limited to loss of data, lost profits, or any harm resulting from reliance on a listing. Our total liability in any matter shall not exceed zero, as the service is provided free of charge.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Governing law</h2>
              <p className="text-sm leading-relaxed text-text-muted">
                These terms are governed by the laws of the United Arab Emirates. Any disputes shall be subject to the exclusive jurisdiction of the courts of Dubai, UAE.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl text-primary mb-3">Contact</h2>
              <p className="text-sm leading-relaxed text-text-muted">
                Questions about these terms? Reach us via our{' '}
                <a href="/contact" className="text-secondary hover:underline">Contact page</a>.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
