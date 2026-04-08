import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description:
    'jobs4u is a free, no-signup jobs board connecting talent with opportunity. Learn how it works.',
};

const JOB_SEEKER_STEPS = [
  {
    step: '1',
    title: 'Browse or search',
    desc: 'Use filters to find jobs by country, employment type, skills, and more. No account required.',
  },
  {
    step: '2',
    title: 'Apply directly',
    desc: 'Contact the employer directly via email or application URL. No middlemen, no fees.',
  },
  {
    step: '3',
    title: 'List yourself',
    desc: 'Create a talent profile so employers can find you. Just verify your email to go live.',
  },
];

const EMPLOYER_STEPS = [
  {
    step: '1',
    title: 'Post your job',
    desc: 'Fill in the job details, add the required skills, and set a contact method.',
  },
  {
    step: '2',
    title: 'Verify your email',
    desc: "Click the link we send you. That's it — your listing goes live immediately.",
  },
  {
    step: '3',
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
      <section
        className="border-b bg-surface border-border"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h1
            className="text-4xl sm:text-5xl font-bold mb-5 font-heading text-secondary"
          >
            About jobs4u
          </h1>
          <p className="text-lg leading-relaxed text-text-muted">
            jobs4u is a minimalist jobs platform built for people who are tired of bloated job boards.
            No accounts, no algorithms, no recruiter fees. Just jobs and talent, directly connected.
          </p>
        </div>
      </section>

      {/* How it works — Job Seekers */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2
          className="text-2xl sm:text-3xl font-bold mb-2 font-heading text-secondary"
        >
          For job seekers
        </h2>
        <p className="text-sm mb-10 text-text-muted">
          Find your next opportunity without the friction.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {JOB_SEEKER_STEPS.map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-primary"
              >
                {step}
              </div>
              <h3
                className="font-semibold text-base font-heading text-text-main"
              >
                {title}
              </h3>
              <p className="text-sm text-text-muted">
                {desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-white font-medium transition-opacity hover:opacity-90 text-sm bg-primary"
          >
            Browse jobs
          </Link>
          <Link
            href="/profiles/new"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium border-2 text-sm transition-colors hover:bg-[#2D5F3A] hover:text-white border-secondary text-secondary"
          >
            Create your profile
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* How it works — Employers */}
      <section
        className="border-b border-border bg-surface"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-2 font-heading text-secondary"
          >
            For employers
          </h2>
          <p className="text-sm mb-10 text-text-muted">
            Post a job in minutes. Reach candidates worldwide.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {EMPLOYER_STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-secondary"
                >
                  {step}
                </div>
                <h3
                  className="font-semibold text-base font-heading text-text-main"
                >
                  {title}
                </h3>
                <p className="text-sm text-text-muted">
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/jobs/new"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-white font-medium transition-opacity hover:opacity-90 text-sm bg-primary"
            >
              Post a job free
            </Link>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2
          className="text-2xl sm:text-3xl font-bold mb-2 font-heading text-secondary"
        >
          Our principles
        </h2>
        <p className="text-sm mb-10 text-text-muted">
          What we stand for.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {VALUES.map(({ icon, title, desc }) => (
            <div key={title} className="flex flex-col gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-surface"
              >
                {icon}
              </div>
              <h3
                className="font-semibold text-base font-heading text-text-main"
              >
                {title}
              </h3>
              <p className="text-sm text-text-muted">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
