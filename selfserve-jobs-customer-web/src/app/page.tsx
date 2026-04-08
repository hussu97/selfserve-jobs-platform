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
      <section className="relative overflow-hidden bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-5 font-heading text-secondary">
              jobs4u
            </h1>
            <p className="text-lg sm:text-xl mb-10 leading-relaxed text-text-muted">
              Find work. Find talent. No signup needed.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-base bg-primary transition-opacity hover:opacity-90"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.32.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25zM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10z" clipRule="evenodd" />
                <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.092.642 4.313.987 6.61.987 2.297 0 4.518-.345 6.61-.987.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 01-9.274 0C3.985 17.585 3 16.402 3 15.055z" />
              </svg>
              Browse Jobs
            </Link>
            <Link
              href="/profiles"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base border-2 border-secondary text-secondary transition-colors hover:bg-secondary hover:border-secondary hover:text-white"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
              </svg>
              Browse Profiles
            </Link>
          </div>

          {/* Stats bar */}
          {stats && (
            <p className="mt-10 text-sm text-text-muted">
              <span className="font-semibold text-primary">
                {stats.active_jobs.toLocaleString()}
              </span>{' '}
              active jobs &middot;{' '}
              <span className="font-semibold text-primary">
                {stats.active_profiles.toLocaleString()}
              </span>{' '}
              active profiles
            </p>
          )}
        </div>

        {/* Decorative bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
      </section>

      {/* How it works strip */}
      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: (
                  <svg className="h-7 w-7 mx-auto text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                ),
                title: 'Browse freely',
                desc: 'Search jobs and profiles with powerful filters. No account required.',
              },
              {
                icon: (
                  <svg className="h-7 w-7 mx-auto text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                ),
                title: 'Post in minutes',
                desc: 'Create a job listing or talent profile. Just your email to verify.',
              },
              {
                icon: (
                  <svg className="h-7 w-7 mx-auto text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                    <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                  </svg>
                ),
                title: 'Connect directly',
                desc: 'Reach out directly — no middlemen, no recruiter fees.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-3 border border-border rounded-2xl p-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-surface">
                  {icon}
                </div>
                <div className="max-w-xs mx-auto">
                  <h3 className="font-semibold text-base text-text-main">
                    {title}
                  </h3>
                  <p className="text-sm mt-1 text-text-muted">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Jobs */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">Recent Opportunities</h2>
            <p className="mt-2 text-text-muted">Latest job listings from around the world</p>
          </div>

          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => (
                <JobCard key={job.code} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl border border-border bg-surface">
              <svg className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.838-2.175 1.064-.14 2.144-.236 3.237-.298V5.25a2.25 2.25 0 012.25-2.25h3.25a2.25 2.25 0 012.25 2.25v.228c1.093.062 2.173.158 3.237.297 1.07.161 1.838 1.094 1.838 2.175v3.783c0 .618-.26 1.174-.674 1.661m0 0" />
              </svg>
              <p className="text-text-muted mb-4">No job listings yet.</p>
              <Link
                href="/jobs/new"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-white font-medium text-sm bg-primary transition-opacity hover:opacity-90"
              >
                Post the first job
              </Link>
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/jobs" className="text-sm font-medium text-primary hover:opacity-70 transition-opacity inline-flex items-center gap-1">
              View all jobs
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Available Talent */}
      <section className="border-t border-border bg-surface py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">Available Talent</h2>
            <p className="mt-2 text-text-muted">Professionals open to new opportunities</p>
          </div>

          {profiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {profiles.map((profile) => (
                <ProfileCard key={profile.code} profile={profile} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl border border-border bg-bg">
              <svg className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <p className="text-text-muted mb-4">No talent profiles yet.</p>
              <Link
                href="/profiles/new"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-white font-medium text-sm bg-primary transition-opacity hover:opacity-90"
              >
                Create the first profile
              </Link>
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/profiles" className="text-sm font-medium text-primary hover:opacity-70 transition-opacity inline-flex items-center gap-1">
              View all profiles
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA footer strip */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-secondary">
              Ready to get started?
            </h2>
            <p className="mb-8 text-base text-text-muted">
              Free forever. No spam. No recruiters.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/jobs/new"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-white font-semibold text-base bg-primary transition-opacity hover:opacity-90"
            >
              Post a Job
            </Link>
            <Link
              href="/profiles/new"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-base border-2 border-secondary text-secondary transition-colors hover:bg-secondary hover:text-white"
            >
              Create a Profile
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
