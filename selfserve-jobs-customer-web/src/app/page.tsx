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
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-5"
            style={{ fontFamily: 'Lora, serif', color: 'var(--color-secondary)' }}
          >
            jobs4u
          </h1>
          <p
            className="text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Find work. Find talent. No signup needed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.32.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25zM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10z" clipRule="evenodd" />
                <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.092.642 4.313.987 6.61.987 2.297 0 4.518-.345 6.61-.987.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 01-9.274 0C3.985 17.585 3 16.402 3 15.055z" />
              </svg>
              Browse Jobs
            </Link>
            <Link
              href="/profiles"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base border-2 transition-colors hover:bg-[#C2703E] hover:text-white hover:border-[#C2703E]"
              style={{
                borderColor: 'var(--color-secondary)',
                color: 'var(--color-secondary)',
              }}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
              </svg>
              Browse Profiles
            </Link>
          </div>

          {/* Stats bar */}
          {stats && (
            <p className="mt-10 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                {stats.active_jobs.toLocaleString()}
              </span>{' '}
              active jobs &middot;{' '}
              <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                {stats.active_profiles.toLocaleString()}
              </span>{' '}
              active profiles
            </p>
          )}
        </div>

        {/* Decorative bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
      </section>

      {/* How it works strip */}
      <section
        className="border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: (
                  <svg className="h-7 w-7 mx-auto" style={{ color: 'var(--color-primary)' }} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                ),
                title: 'Browse freely',
                desc: 'Search jobs and profiles with powerful filters. No account required.',
              },
              {
                icon: (
                  <svg className="h-7 w-7 mx-auto" style={{ color: 'var(--color-primary)' }} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                ),
                title: 'Post in minutes',
                desc: 'Create a job listing or talent profile. Just your email to verify.',
              },
              {
                icon: (
                  <svg className="h-7 w-7 mx-auto" style={{ color: 'var(--color-primary)' }} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                    <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                  </svg>
                ),
                title: 'Connect directly',
                desc: 'Reach out directly — no middlemen, no recruiter fees.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                >
                  {icon}
                </div>
                <h3
                  className="font-semibold text-base"
                  style={{ fontFamily: 'Lora, serif', color: 'var(--color-text)' }}
                >
                  {title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Jobs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2
              className="text-2xl sm:text-3xl font-bold"
              style={{ fontFamily: 'Lora, serif', color: 'var(--color-secondary)' }}
            >
              Recent Opportunities
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Latest job listings from around the world
            </p>
          </div>
          <Link
            href="/jobs"
            className="text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-1 whitespace-nowrap"
            style={{ color: 'var(--color-primary)' }}
          >
            View all
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <JobCard key={job.code} job={job} />
            ))}
          </div>
        ) : (
          <div
            className="text-center py-16 rounded-2xl border"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <p style={{ color: 'var(--color-text-muted)' }}>No job listings yet.</p>
            <Link
              href="/jobs/new"
              className="mt-3 inline-block text-sm font-medium hover:opacity-70"
              style={{ color: 'var(--color-primary)' }}
            >
              Post the first job →
            </Link>
          </div>
        )}
      </section>

      {/* Available Talent */}
      <section
        className="border-t"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2
                className="text-2xl sm:text-3xl font-bold"
                style={{ fontFamily: 'Lora, serif', color: 'var(--color-secondary)' }}
              >
                Available Talent
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Professionals open to new opportunities
              </p>
            </div>
            <Link
              href="/profiles"
              className="text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-1 whitespace-nowrap"
              style={{ color: 'var(--color-primary)' }}
            >
              View all
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {profiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {profiles.map((profile) => (
                <ProfileCard key={profile.code} profile={profile} />
              ))}
            </div>
          ) : (
            <div
              className="text-center py-16 rounded-2xl border"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
            >
              <p style={{ color: 'var(--color-text-muted)' }}>No talent profiles yet.</p>
              <Link
                href="/profiles/new"
                className="mt-3 inline-block text-sm font-medium hover:opacity-70"
                style={{ color: 'var(--color-primary)' }}
              >
                Create the first profile →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA footer strip */}
      <section
        className="border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ fontFamily: 'Lora, serif', color: 'var(--color-secondary)' }}
          >
            Ready to get started?
          </h2>
          <p className="mb-8 text-base" style={{ color: 'var(--color-text-muted)' }}>
            Free forever. No spam. No recruiters.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/jobs/new"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Post a Job
            </Link>
            <Link
              href="/profiles/new"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold border-2 transition-colors hover:bg-[#2D5F3A] hover:text-white"
              style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
            >
              Create a Profile
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
