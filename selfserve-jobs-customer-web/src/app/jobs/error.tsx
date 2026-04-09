'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function JobsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="hero-gradient">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-md">
          <p className="text-xs uppercase tracking-widest text-text-muted mb-4">Error</p>
          <h1 className="font-heading text-3xl sm:text-4xl text-primary mb-3">
            Could not load <em>jobs</em>
          </h1>
          <p className="text-text-muted mb-8">
            We ran into a problem fetching job listings. Please try again.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={reset}
              className="px-6 py-3 rounded-full bg-primary text-white text-sm font-medium uppercase tracking-widest hover:bg-primary-hover transition-colors"
            >
              Try again
            </button>
            <Link
              href="/"
              className="px-6 py-3 rounded-full border border-primary text-primary text-sm font-medium uppercase tracking-widest hover:bg-primary hover:text-white transition-colors"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
