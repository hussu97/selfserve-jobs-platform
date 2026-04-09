import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="hero-gradient min-h-screen flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-24 text-center">
        <p className="font-heading text-6xl italic text-primary mb-6">
          404
        </p>
        <h1 className="font-heading text-2xl text-primary mb-3">
          Page not <em>found</em>
        </h1>
        <p className="text-sm mb-8 text-text-muted">
          This listing was not found or has expired. It may have been removed by the owner.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-medium text-sm transition-opacity hover:opacity-90 bg-primary"
          >
            Browse Jobs
          </Link>
          <Link
            href="/profiles"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full font-medium text-sm transition-colors hover:bg-primary hover:text-white bg-surface-lowest shadow-ambient text-primary"
          >
            Browse Profiles
          </Link>
        </div>
      </div>
    </div>
  );
}
