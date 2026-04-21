import Link from 'next/link';
import { JobCard } from '@/components/jobs/JobCard';
import { ProfileCard } from '@/components/profiles/ProfileCard';
import { getJobs, getProfiles, getStats } from '@/lib/api';

export default async function HomePage() {
  const [statsResult, jobsResult, profilesResult] = await Promise.allSettled([
    getStats(),
    getJobs({ per_page: 6 }),
    getProfiles({ per_page: 6 }),
  ]);

  const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;
  const jobs = jobsResult.status === 'fulfilled' ? jobsResult.value.items : [];
  const profiles = profilesResult.status === 'fulfilled' ? profilesResult.value.items : [];

  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-28 sm:py-36" style={{ backgroundColor: '#121211' }}>
        {/* Flowing UAE Flag Background */}
        <div className="absolute inset-0 z-0 opacity-40 flag-weave">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            aria-hidden="true"
            src="/uae-flag-background.png"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Top/bottom fade to dark */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, #121211 0%, transparent 25%, transparent 75%, #121211 100%)' }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow */}
          <div
            className="anim-fade-up inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-widest"
            style={{ backgroundColor: 'rgba(56,75,59,0.45)', backdropFilter: 'blur(10px)', color: '#b6ccb7', border: '1px solid rgba(182,204,183,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#8BA888' }} />
            Supporting our community in times of change
          </div>

          {/* Headline */}
          <h1
            className="anim-fade-up anim-delay-1 font-heading text-5xl sm:text-7xl lg:text-8xl leading-[1.08] tracking-tight mb-8"
            style={{ color: '#fcf9f5' }}
          >
            Your Talent is<br />
            <em className="italic" style={{ color: '#b6ccb7' }}>Still Your Power.</em>
          </h1>

          {/* Subheading */}
          <p
            className="anim-fade-up anim-delay-2 text-lg sm:text-xl leading-relaxed mb-12 max-w-3xl mx-auto font-light"
            style={{ color: '#c3c8c0' }}
          >
            If recent events have shaken your career in the UAE, hear this: you are not alone.
            This is a place where talent is truly valued and opportunities are real — no algorithms, no spam, no cost.
          </p>

          {/* CTAs */}
          <div className="anim-fade-up anim-delay-3 flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-center gap-4">
            <Link
              href="/profiles/new"
              className="inline-flex items-center justify-center px-10 py-4 rounded-2xl text-base font-semibold transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ backgroundColor: '#384B3B', color: '#fcf9f5', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
            >
              Get Hired
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center px-10 py-4 rounded-2xl text-base font-semibold transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ backgroundColor: 'rgba(252,249,245,0.07)', backdropFilter: 'blur(10px)', color: '#fcf9f5', border: '1px solid rgba(195,200,192,0.25)' }}
            >
              Discover Roles
            </Link>
          </div>
        </div>
      </section>

      {/* ── Browse ───────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28" style={{ backgroundColor: '#1a2e1c' }}>
        {/* Dubai Marina background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden="true"
          src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1920&q=80"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, #1a2e1c 0%, transparent 30%, transparent 70%, #1a2e1c 100%)' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#8BA888' }}>
              Explore the platform
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl" style={{ color: '#fcf9f5' }}>
              Where would you like to <em>go?</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Browse Talent */}
            <Link
              href="/profiles"
              className="group bg-surface-lowest shadow-ambient rounded-2xl p-10 flex flex-col gap-6 hover:-translate-y-1 hover:shadow-ambient-hover transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Open to work</p>
                  <h3 className="font-heading text-3xl sm:text-4xl text-primary">
                    Browse <em>Talent</em>
                  </h3>
                </div>
                <svg className="h-6 w-6 text-text-muted group-hover:text-primary transition-colors mt-1 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.25-7.25a.75.75 0 00-1.06-1.06L5.22 13.72a.75.75 0 000 1.06z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M7.25 6.5a.75.75 0 01.75-.75h5.5a.75.75 0 01.75.75v5.5a.75.75 0 01-1.5 0V7.25H8a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                </svg>
              </div>
              {stats && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary/70 inline-block shrink-0" />
                  <span className="font-semibold text-text-main">{stats.active_profiles.toLocaleString()}</span>
                  <span className="text-text-muted text-sm">active profiles</span>
                </div>
              )}
              <p className="text-sm text-text-muted leading-relaxed">
                Discover verified professionals actively seeking opportunities across the UAE.
              </p>
            </Link>

            {/* Browse Jobs */}
            <Link
              href="/jobs"
              className="group bg-surface-lowest shadow-ambient rounded-2xl p-10 flex flex-col gap-6 hover:-translate-y-1 hover:shadow-ambient-hover transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Latest listings</p>
                  <h3 className="font-heading text-3xl sm:text-4xl text-primary">
                    Discover <em>Roles</em>
                  </h3>
                </div>
                <svg className="h-6 w-6 text-text-muted group-hover:text-primary transition-colors mt-1 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.25-7.25a.75.75 0 00-1.06-1.06L5.22 13.72a.75.75 0 000 1.06z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M7.25 6.5a.75.75 0 01.75-.75h5.5a.75.75 0 01.75.75v5.5a.75.75 0 01-1.5 0V7.25H8a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                </svg>
              </div>
              {stats && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary/70 inline-block shrink-0" />
                  <span className="font-semibold text-text-main">{stats.active_jobs.toLocaleString()}</span>
                  <span className="text-text-muted text-sm">active jobs</span>
                </div>
              )}
              <p className="text-sm text-text-muted leading-relaxed">
                Verified opportunities from vetted companies — no spam, no pay-to-rank, always free.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-bg">
        {/* Burj Khalifa background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden="true"
          src="https://images.unsplash.com/photo-1578895101408-1a36b834405b?auto=format&fit=crop&w=1920&q=80"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.15]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
              How it works
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl text-primary">
              Simple by <span className="italic">design</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                num: '01',
                icon: (
                  <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                ),
                title: 'Create a profile',
                desc: 'Talent posts a profile with email verification. No account required. Goes live immediately.',
              },
              {
                num: '02',
                icon: (
                  <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                ),
                title: 'Hiring teams apply for access',
                desc: 'Hiring teams register with their LinkedIn. After admin approval, they get full access to contact details and resumes.',
              },
              {
                num: '03',
                icon: (
                  <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                    <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                  </svg>
                ),
                title: 'Connect directly',
                desc: 'Verified hiring teams reach out using real contact details. No middlemen, no fees — ever.',
              },
            ].map(({ num, icon, title, desc }) => (
              <div
                key={title}
                className="bg-surface-lowest shadow-ambient rounded-2xl p-8 flex flex-col gap-4"
              >
                <span className="font-heading italic text-secondary text-4xl leading-none">{num}</span>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/8">
                  {icon}
                </div>
                <div>
                  <h3 className="font-heading text-xl text-primary mb-1">{title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Available Talent ─────────────────────────────── (TALENT FIRST) */}
      <section className="relative overflow-hidden bg-surface py-20 sm:py-28">
        {/* Dubai Creek / traditional abra boats background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden="true"
          src="https://images.unsplash.com/photo-1548266652-99cf27701ced?auto=format&fit=crop&w=1920&q=80"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.15]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
                Open to work
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl text-primary">
                Available <span className="italic">Talent</span>
              </h2>
            </div>
            <Link
              href="/profiles"
              className="hidden sm:inline-flex items-center gap-1.5 text-primary font-semibold uppercase tracking-wider text-xs hover:opacity-70 transition-opacity"
            >
              View all
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {profiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <ProfileCard key={profile.code} profile={profile} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl bg-surface-lowest shadow-ambient">
              <p className="text-text-muted text-sm mb-4">No talent profiles yet.</p>
              <Link
                href="/profiles/new"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-white font-semibold text-sm bg-primary-btn transition-all hover:bg-primary hover:shadow-ambient-hover active:scale-[0.98]"
              >
                Create the first profile
              </Link>
            </div>
          )}

          {/* Mobile view all */}
          {profiles.length > 0 && (
            <div className="mt-8 sm:hidden text-center">
              <Link
                href="/profiles"
                className="inline-flex items-center gap-1.5 text-primary font-semibold uppercase tracking-wider text-xs hover:opacity-70 transition-opacity"
              >
                View all profiles
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Recent Jobs ──────────────────────────────────── */}
      <section className="relative overflow-hidden bg-bg py-20 sm:py-28">
        {/* UAE desert dunes background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden="true"
          src="https://images.unsplash.com/photo-1562350683-774f43c5bdca?auto=format&fit=crop&w=1920&q=80"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.15]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
                Latest listings
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl text-primary">
                Recent <span className="italic">Opportunities</span>
              </h2>
            </div>
            <Link
              href="/jobs"
              className="hidden sm:inline-flex items-center gap-1.5 text-primary font-semibold uppercase tracking-wider text-xs hover:opacity-70 transition-opacity"
            >
              View all
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard key={job.code} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl bg-surface-lowest shadow-ambient">
              <p className="text-text-muted text-sm mb-4">No job listings yet.</p>
              <Link
                href="/hiring/register"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-white font-semibold text-sm bg-primary-btn transition-all hover:bg-primary hover:shadow-ambient-hover active:scale-[0.98]"
              >
                Post the first job
              </Link>
            </div>
          )}

          {/* Mobile view all */}
          {jobs.length > 0 && (
            <div className="mt-8 sm:hidden text-center">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-1.5 text-primary font-semibold uppercase tracking-wider text-xs hover:opacity-70 transition-opacity"
              >
                View all jobs
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>


    </div>
  );
}
