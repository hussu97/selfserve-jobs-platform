import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-24 text-center">
      <p
        className="text-7xl font-bold mb-6 font-heading text-border"
      >
        404
      </p>
      <h1
        className="text-2xl font-bold mb-3 font-heading text-secondary"
      >
        Page not found
      </h1>
      <p className="text-sm mb-8 text-text-muted">
        This listing was not found or has expired. It may have been removed by the owner.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/jobs"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90 bg-primary"
        >
          Browse Jobs
        </Link>
        <Link
          href="/profiles"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium text-sm border-2 transition-colors hover:bg-[#2D5F3A] hover:text-white border-secondary text-secondary"
        >
          Browse Profiles
        </Link>
      </div>
    </div>
  );
}
