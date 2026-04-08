import Link from 'next/link';

export function Footer() {
  return (
    <footer
      className="border-t mt-16"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <span
              className="font-bold text-xl"
              style={{ fontFamily: 'Lora, serif', color: 'var(--color-secondary)' }}
            >
              jobs4u
            </span>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Free to use · No signup required
            </p>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <Link href="/about" className="hover:text-[#C2703E] transition-colors">
              About
            </Link>
            <Link href="/jobs" className="hover:text-[#C2703E] transition-colors">
              Jobs
            </Link>
            <Link href="/profiles" className="hover:text-[#C2703E] transition-colors">
              Profiles
            </Link>
            <Link href="/jobs/new" className="hover:text-[#C2703E] transition-colors">
              Post a Job
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            &copy; {new Date().getFullYear()} jobs4u
          </p>
        </div>
      </div>
    </footer>
  );
}
