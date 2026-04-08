import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-24 text-center">
      <p
        className="text-7xl font-bold mb-6"
        style={{ fontFamily: 'Lora, serif', color: 'var(--color-border)' }}
      >
        404
      </p>
      <h1
        className="text-2xl font-bold mb-3"
        style={{ fontFamily: 'Lora, serif', color: 'var(--color-secondary)' }}
      >
        Page not found
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
        This listing was not found or has expired. It may have been removed by the owner.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/jobs"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Browse Jobs
        </Link>
        <Link
          href="/profiles"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium text-sm border-2 transition-colors hover:bg-[#2D5F3A] hover:text-white"
          style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
        >
          Browse Profiles
        </Link>
      </div>
    </div>
  );
}
