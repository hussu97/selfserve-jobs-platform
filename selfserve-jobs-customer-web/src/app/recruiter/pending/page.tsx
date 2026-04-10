'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const POLL_INTERVAL_MS = 15_000;

export default function RecruiterPendingPage() {
  const { email, sessionToken, updateRecruiterStatus } = useAuth();
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sessionToken) return;

    const checkStatus = async () => {
      try {
        const me = await getMe(sessionToken);
        if (me.recruiter_status === 'active') {
          updateRecruiterStatus('active');
          router.replace('/account');
        }
      } catch {
        // silently ignore — polling failures shouldn't break the page
      }
    };

    // Check immediately, then on interval
    checkStatus();
    intervalRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionToken, updateRecruiterStatus, router]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-8">
          <svg className="w-8 h-8 text-[var(--color-accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
          Application Received
        </p>
        <h1 className="font-serif text-4xl text-[var(--color-text-main)] mb-4">
          Your account is <em>under review</em>
        </h1>

        {email && (
          <p className="text-[var(--color-text-muted)] mb-2">
            Logged in as <strong className="text-[var(--color-text-main)]">{email}</strong>
          </p>
        )}

        <p className="text-[var(--color-text-muted)] mb-8 leading-relaxed">
          We&apos;ve verified your email and your application is now being reviewed by our team. This typically takes 1–2 business days.
        </p>

        {/* What happens next */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-6 mb-8">
          <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-4">What happens next</p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-[var(--color-accent)] shrink-0 mt-0.5 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-main)]">Email verified</p>
                <p className="text-xs text-[var(--color-text-muted)]">Your email address has been confirmed</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full border-2 border-[var(--color-border)] shrink-0 mt-0.5 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-main)]">Profile review</p>
                <p className="text-xs text-[var(--color-text-muted)]">Our team is reviewing your LinkedIn profile</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full border-2 border-[var(--color-border)] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--color-text-muted)]">Access granted</p>
                <p className="text-xs text-[var(--color-text-muted)]">You&apos;ll receive an email when approved</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/profiles"
            className="flex-1 text-center bg-[var(--color-surface)] hover:bg-[var(--color-border)] text-[var(--color-text-main)] rounded-full px-6 py-3 font-medium transition-colors"
          >
            Browse Talent
          </Link>
          <Link
            href="/jobs"
            className="flex-1 text-center border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] rounded-full px-6 py-3 font-medium transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
