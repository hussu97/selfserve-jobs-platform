import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-bold text-xl font-heading text-secondary">
              jobs4u
            </span>
            <p className="text-xs text-text-muted">
              Free to use · No signup required
            </p>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm text-text-muted">
            <Link href="/about" className="hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/jobs" className="hover:text-primary transition-colors">
              Jobs
            </Link>
            <Link href="/profiles" className="hover:text-primary transition-colors">
              Profiles
            </Link>
            <Link href="/jobs/new" className="hover:text-primary transition-colors">
              Post a Job
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} jobs4u
          </p>
        </div>
      </div>
    </footer>
  );
}
