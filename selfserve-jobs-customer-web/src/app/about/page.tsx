import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description:
    'jobs4u is a free, no-signup jobs board connecting talent with opportunity. Learn how it works.',
};

const JOB_SEEKER_STEPS = [
  {
    step: '01',
    title: 'Browse or search',
    desc: 'Use filters to find jobs by country, employment type, skills, and more. No account required.',
  },
  {
    step: '02',
    title: 'Apply directly',
    desc: 'Contact the employer directly via email or application URL. No middlemen, no fees.',
  },
  {
    step: '03',
    title: 'List yourself',
    desc: 'Create a talent profile so employers can find you. Just verify your email to go live.',
  },
];

const EMPLOYER_STEPS = [
  {
    step: '01',
    title: 'Post your job',
    desc: 'Fill in the job details, add the required skills, and set a contact method.',
  },
  {
    step: '02',
    title: 'Verify your email',
    desc: "Click the link we send you. That's it — your listing goes live immediately.",
  },
  {
    step: '03',
    title: 'Manage your listing',
    desc: 'Use your management link to edit or remove the listing at any time.',
  },
];

const VALUES = [
  {
    icon: (
      <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Always free',
    desc: 'Posting jobs and profiles is free. Browsing is free. There are no premium tiers, no pay-to-rank.',
  },
  {
    icon: (
      <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: 'No signup',
    desc: "We don't collect passwords or personal data beyond what's needed. Verify your email, you're done.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    title: 'No spam',
    desc: 'We only send verification and management emails — never newsletters, never marketing.',
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-4 block">
            About jobs4u
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl text-primary mb-6">
            Jobs without the <em>noise</em>
          </h1>
          <p className="text-lg leading-relaxed text-text-muted max-w-2xl mx-auto">
            jobs4u is a minimalist jobs platform built for people who are tired of bloated job boards.
            No accounts, no algorithms, no recruiter fees. Just jobs and talent, directly connected.
          </p>
        </div>
      </section>

      {/* How it works — Job Seekers */}
      <section className="bg-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3 block">
              For job seekers
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl text-primary mb-3">
              Find your next <em>opportunity</em>
            </h2>
            <p className="text-sm text-text-muted">
              No friction. No algorithms. Just listings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {JOB_SEEKER_STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col gap-3 rounded-2xl bg-surface-lowest shadow-ambient p-6">
                <span className="font-heading text-3xl italic text-secondary">{step}</span>
                <h3 className="font-semibold text-base font-heading text-text-main">
                  {title}
                </h3>
                <p className="text-sm text-text-muted">
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center gap-3">
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-medium transition-opacity hover:opacity-90 text-sm bg-primary"
            >
              Browse jobs
            </Link>
            <Link
              href="/profiles/new"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full font-medium text-sm transition-colors hover:bg-primary hover:text-white bg-surface-lowest shadow-ambient text-primary"
            >
              Create your profile
            </Link>
          </div>
        </div>
      </section>

      {/* How it works — Employers */}
      <section className="bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3 block">
              For employers
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl text-primary mb-3">
              Post a job in <em>minutes</em>
            </h2>
            <p className="text-sm text-text-muted">
              Reach candidates worldwide. Always free.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {EMPLOYER_STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col gap-3 rounded-2xl bg-surface-lowest shadow-ambient p-6">
                <span className="font-heading text-3xl italic text-secondary">{step}</span>
                <h3 className="font-semibold text-base font-heading text-text-main">
                  {title}
                </h3>
                <p className="text-sm text-text-muted">
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/jobs/new"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-medium transition-opacity hover:opacity-90 text-sm bg-primary"
            >
              Post a job free
            </Link>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3 block">
              Our principles
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl text-primary mb-3">
              What we <em>stand for</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {VALUES.map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3 rounded-2xl bg-surface-lowest shadow-ambient p-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-surface">
                  {icon}
                </div>
                <h3 className="font-semibold text-base font-heading text-text-main">
                  {title}
                </h3>
                <p className="text-sm text-text-muted">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
