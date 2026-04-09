'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-widest text-text-muted mb-4">Something went wrong</p>
        <h1 className="font-heading text-3xl sm:text-4xl text-primary mb-3">
          An unexpected <em>error</em> occurred
        </h1>
        <p className="text-text-muted mb-8">
          We ran into a problem loading this page. Please try again or go back to the homepage.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-full bg-primary-btn text-white text-sm font-medium uppercase tracking-widest hover:bg-primary transition-colors"
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
  );
}
