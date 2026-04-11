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
      <section className="hero-gradient relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 sm:py-36 lg:py-48">
          <div className="max-w-3xl mx-auto text-center">
            {/* Eyebrow */}
            <div className="anim-fade-up inline-flex items-center gap-2 mb-7 px-4 py-1.5 rounded-full bg-surface shadow-ambient text-xs font-semibold uppercase tracking-widest text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              UAE&apos;s Talent-First Tech Platform
            </div>

            {/* Headline */}
            <h1 className="anim-fade-up anim-delay-1 font-heading text-5xl sm:text-6xl lg:text-7xl leading-tight text-primary mb-6">
              Find <span className="italic">Extraordinary</span> Talent.
            </h1>

            {/* Subheading */}
            <p className="anim-fade-up anim-delay-2 text-lg text-text-muted leading-relaxed mb-10 max-w-xl mx-auto">
              Talent profiles are free and friction-free. Verified recruiters get full access to resumes and contact details.
            </p>

            {/* CTAs — talent first */}
            <div className="anim-fade-up anim-delay-3 flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-center gap-3">
              <Link
                href="/profiles"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold text-sm bg-primary-btn shadow-ambient transition-all hover:bg-primary hover:shadow-ambient-hover active:scale-[0.98]"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
                </svg>
                Browse Talent
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm text-secondary bg-surface shadow-ambient transition-all hover:bg-secondary hover:text-white hover:shadow-ambient-hover active:scale-[0.98]"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.32.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25zM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10z" clipRule="evenodd" />
                  <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.092.642 4.313.987 6.61.987 2.297 0 4.518-.345 6.61-.987.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 01-9.274 0C3.985 17.585 3 16.402 3 15.055z" />
                </svg>
                Browse Jobs
              </Link>
            </div>

            {/* Stats — profiles first */}
            {stats && (
              <div className="anim-fade-up anim-delay-4 flex items-center justify-center gap-4 mt-10">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary/70 inline-block" />
                  <span className="font-semibold text-text-main">{stats.active_profiles.toLocaleString()}</span>
                  <span className="text-text-muted">active profiles</span>
                </div>
                <span className="text-border">·</span>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-primary/70 inline-block" />
                  <span className="font-semibold text-text-main">{stats.active_jobs.toLocaleString()}</span>
                  <span className="text-text-muted">active jobs</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA strip ────────────────────────────────────── */}
      <section className="bg-primary py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-4xl sm:text-5xl text-white mb-4">
            Ready to get <span className="italic">started?</span>
          </h2>
          <p className="text-white/70 mb-10 text-lg">
            Free to post · Free to browse · Always
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-center gap-3">
            <Link
              href="/profiles/new"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-full text-primary font-semibold text-sm bg-white shadow-ambient transition-all hover:bg-surface hover:shadow-ambient-hover active:scale-[0.98]"
            >
              Create a Profile
            </Link>
            <Link
              href="/recruiter/register"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-full font-semibold text-sm text-white bg-white/10 transition-all hover:bg-white/20 active:scale-[0.98]"
            >
              Post a Job
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why we built this (summary) ──────────────────── */}
      <section className="bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">
            Our story
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl text-primary mb-8">
            Why we built <em>this</em>
          </h2>
          <p className="text-base leading-relaxed text-text-muted mb-6">
            Economic disruption across the Middle East is real — people are losing jobs, facing salary cuts, and watching
            stability erode. We built hirebridge as a focused response: a place where talent can be discovered and companies
            post real jobs, without algorithms, spam, or pay-to-rank. Talent profiles are friction-free. Recruiters
            register once and get verified access to contact details and resumes. Free to post · Free to browse · Always.
          </p>
          <Link href="/about" className="text-sm font-semibold text-secondary hover:text-secondary-hover transition-colors">
            Read our story →
          </Link>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
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
                title: 'Recruiters apply for access',
                desc: 'Recruiters register with their LinkedIn. After admin approval, they get full access to contact details and resumes.',
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
                desc: 'Verified recruiters reach out using real contact details. No middlemen, no fees — ever.',
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
      <section className="bg-surface py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <section className="bg-bg py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                href="/recruiter/register"
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
