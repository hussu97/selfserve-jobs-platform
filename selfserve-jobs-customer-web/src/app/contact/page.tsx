import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the team behind hirebridge.',
};

const FOUNDERS = [
  {
    name: 'Hussain Abbasi',
    initials: 'HA',
    headline: 'Head of Product · noon',
    linkedin: 'https://www.linkedin.com/in/hussainabbasi/',
    color: 'bg-primary',
  },
  {
    name: 'Tejasvie Subrahmanyam',
    initials: 'TS',
    headline: 'Q-commerce Lead, Middle East · Amazon Now UAE',
    linkedin: 'https://www.linkedin.com/in/tejasvie-subrahmanyam/',
    color: 'bg-secondary',
  },
];

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-4 block">
            Get in touch
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl text-primary mb-6">
            Say <em>hello</em>
          </h1>
          <p className="text-lg leading-relaxed text-text-muted max-w-xl mx-auto">
            hirebridge UAE is built by a small team. We read every message — whether it&rsquo;s feedback, a bug report, or just a question.
          </p>
        </div>
      </section>

      {/* Founders */}
      <section className="bg-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3 block">
              The team
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl text-primary">
              The people <em>behind it</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FOUNDERS.map((founder) => (
              <a
                key={founder.name}
                href={founder.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-6 hover:-translate-y-1 transition-all duration-200"
              >
                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <div
                    className={`w-16 h-16 rounded-2xl ${founder.color} flex items-center justify-center shrink-0`}
                  >
                    <span className="font-heading text-xl italic text-white">
                      {founder.initials}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading text-lg text-primary leading-tight">
                      {founder.name}
                    </p>
                    <p className="text-sm text-text-muted mt-0.5">{founder.headline}</p>
                  </div>
                </div>

                {/* LinkedIn CTA */}
                <div className="flex items-center gap-2 text-[#0A66C2] text-sm font-medium group-hover:gap-3 transition-all">
                  <LinkedInIcon />
                  <span>View on LinkedIn</span>
                  <svg className="w-3.5 h-3.5 opacity-60" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path d="M2 7h10M7 2l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact info */}
      <section className="bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3 block">
            Reach out
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl text-primary mb-6">
            How to <em>contact us</em>
          </h2>
          <p className="text-text-muted text-sm leading-relaxed max-w-lg mx-auto mb-10">
            For bug reports, feedback, listing disputes, or data requests — reach out on LinkedIn to either of the founders above. We aim to respond within 2 business days.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
            <div className="bg-surface-lowest shadow-ambient rounded-xl p-5 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-text-main">Report a listing</p>
              <p className="text-xs text-text-muted">Use the Report button on any listing page to flag inappropriate content.</p>
              <Link href="/jobs" className="text-xs text-secondary hover:underline mt-1">Browse listings →</Link>
            </div>

            <div className="bg-surface-lowest shadow-ambient rounded-xl p-5 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-text-main">Privacy requests</p>
              <p className="text-xs text-text-muted">Data deletion or access requests — message us on LinkedIn with your email address.</p>
              <Link href="/privacy" className="text-xs text-secondary hover:underline mt-1">Privacy policy →</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
