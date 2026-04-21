import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "About hirebridge — A Free Job Platform Built for the UAE",
  description:
    "hirebridge is a free UAE job platform built for people who need it most. Talent profiles are friction-free. Hiring teams register for verified access to candidate data. Learn how it works.",
  alternates: { canonical: '/about' },
};

const JOB_SEEKER_STEPS = [
  {
    step: '01',
    title: 'List yourself',
    desc: 'Create a talent profile so hiring teams can find you. Just verify your email to go live — no account needed.',
  },
  {
    step: '02',
    title: 'Browse or search',
    desc: 'Use filters to find jobs by country, employment type, skills, and more. No account required.',
  },
  {
    step: '03',
    title: 'Apply directly',
    desc: 'Contact the employer directly via email or application URL. No fees.',
  },
];

const HIRING_TEAM_STEPS = [
  {
    step: '01',
    title: 'Register your account',
    desc: 'Submit your name, company, email, and LinkedIn profile. Registration is free.',
  },
  {
    step: '02',
    title: 'Get approved',
    desc: 'We review hiring team applications within 1–2 business days to ensure talent data is accessed responsibly.',
  },
  {
    step: '03',
    title: 'Post jobs & access talent',
    desc: 'Post job listings and view sensitive talent details — email, phone, and resume — all in one place.',
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
    desc: 'No premium tiers, no pay-to-rank. Listings are ranked by recency, not by spend. Free to post · Free to browse · Always.',
  },
  {
    icon: (
      <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Verified access',
    desc: 'Talent contact details are only accessible to approved hiring teams — never exposed to anonymous browsers.',
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
      <section className="relative overflow-hidden min-h-[50vh] flex items-center" style={{ backgroundColor: '#121211' }}>
        {/* Sheikh Zayed Grand Mosque background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden="true"
          src="https://images.unsplash.com/photo-1620937170928-a03bb6261277?auto=format&fit=crop&w=1920&q=80"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.35]"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, #121211 0%, transparent 25%, transparent 75%, #121211 100%)' }}
        />
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest mb-4 block" style={{ color: '#8BA888' }}>
            About hirebridge
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl mb-6" style={{ color: '#fcf9f5' }}>
            A job platform built for our <em>community</em>
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: '#c3c8c0' }}>
            hirebridge puts people first. Professionals list themselves with nothing more than an email verification.
            Hiring teams register for a verified account and get approved before accessing candidate data.
            No fees, no algorithms, no noise — ever.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="relative overflow-hidden bg-surface">
        {/* Al Fahidi historical district / old Dubai background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden="true"
          src="https://images.unsplash.com/photo-1579547621706-1a9c79d5c9f1?auto=format&fit=crop&w=1920&q=80"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.15]"
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4 block">
            Our story
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl text-primary mb-8">
            Why we built <em>this</em>
          </h2>

          <div className="space-y-5 text-base leading-relaxed text-text-muted text-left sm:text-center">
            <p>
              Recent events have had a real and painful impact on everyday lives across the UAE.
              People are losing their jobs, facing salary cuts, and watching the stability they
              built over years erode. Those effects don&apos;t stay abstract — they show up
              in households, families, and careers.
            </p>
            <p>
              We built hirebridge UAE as a small, focused response. Major job platforms are noisy —
              buried in algorithms, spam, and pay-to-play rankings. We wanted
              something simpler: a concentrated space where talent can be discovered and real
              companies post real jobs, without the clutter or the cost.
            </p>
            <p>
              The platform is designed around a dual model. Talent profiles are friction-free —
              verify your email and you&apos;re live. Hiring teams go through a lightweight registration
              and approval process so that sensitive candidate data (email, phone, resume) is only
              accessed by verified parties. This keeps the platform useful for everyone while
              protecting professionals from unsolicited outreach.
            </p>
            <p>
              hirebridge is a personal project by{' '}
              <strong className="text-text-main">Hussain</strong> and{' '}
              <strong className="text-text-main">Tejasvie</strong> — two people who
              wanted to do something useful with the tools they have. There are no plans to
              introduce paid tiers or monetize the platform. If you&apos;d like to learn
              more about us or get in touch, visit the{' '}
              <Link href="/contact" className="text-secondary font-medium hover:text-secondary-hover transition-colors underline underline-offset-2">
                contact page
              </Link>.
            </p>
          </div>
        </div>
      </section>

      {/* How it works — Job Seekers */}
      <section className="bg-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3 block">
              For talent
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
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-medium transition-opacity hover:opacity-90 text-sm bg-primary-btn"
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

      {/* How it works — Hiring Teams */}
      <section className="bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3 block">
              For hiring teams
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl text-primary mb-3">
              Access verified <em>talent</em>
            </h2>
            <p className="text-sm text-text-muted">
              Register once, get approved, and post jobs or browse candidate profiles — free.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HIRING_TEAM_STEPS.map(({ step, title, desc }) => (
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
              href="/hiring/register"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-medium transition-opacity hover:opacity-90 text-sm bg-primary-btn"
            >
              Register for hiring access
            </Link>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative overflow-hidden bg-bg">
        {/* Palm Jumeirah aerial background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden="true"
          src="https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?auto=format&fit=crop&w=1920&q=80"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.15]"
        />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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
