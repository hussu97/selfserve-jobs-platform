import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-surface mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">

          {/* Brand */}
          <div className="flex flex-col gap-1.5">
            <span className="text-lg font-heading italic text-primary tracking-tight">
              jobs4u
            </span>
            <p className="text-xs text-text-muted max-w-[200px] leading-relaxed">
              Free jobs platform. No signup, no recruiters, no fees.
            </p>
          </div>

          {/* Nav groups */}
          <div className="flex flex-wrap gap-x-12 gap-y-6 sm:gap-x-16">
            <div className="flex flex-col gap-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted/50">Browse</p>
              <div className="flex flex-col gap-2">
                <Link href="/jobs" className="text-xs uppercase tracking-widest text-text-muted hover:text-text-main transition-colors">
                  Jobs
                </Link>
                <Link href="/profiles" className="text-xs uppercase tracking-widest text-text-muted hover:text-text-main transition-colors">
                  Talent Profiles
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted/50">Post</p>
              <div className="flex flex-col gap-2">
                <Link href="/jobs/new" className="text-xs uppercase tracking-widest text-text-muted hover:text-text-main transition-colors">
                  Post a Job
                </Link>
                <Link href="/profiles/new" className="text-xs uppercase tracking-widest text-text-muted hover:text-text-main transition-colors">
                  Create Profile
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted/50">Info</p>
              <div className="flex flex-col gap-2">
                <Link href="/about" className="text-xs uppercase tracking-widest text-text-muted hover:text-text-main transition-colors">
                  About
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-widest text-text-muted/60">
            &copy; {new Date().getFullYear()} jobs4u
          </p>
          <p className="text-[10px] uppercase tracking-widest text-text-muted/50">
            Free to use · No signup required
          </p>
        </div>
      </div>
    </footer>
  );
}
