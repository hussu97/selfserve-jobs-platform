'use client';

import Link from 'next/link';
import { JobForm } from '@/components/jobs/JobForm';
import { useAuth } from '@/context/AuthContext';

export default function NewJobPage() {
  const { isHydrated, isActiveRecruiter, isPendingRecruiter, isLoggedIn } = useAuth();

  // Show nothing until hydrated (avoids flash)
  if (!isHydrated) {
    return <div className="hero-gradient min-h-screen" />;
  }

  // Pending recruiter — explain they need approval
  if (isPendingRecruiter) {
    return (
      <div className="hero-gradient min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[var(--color-accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl italic text-[var(--color-text-main)] mb-3">
            Account under review
          </h1>
          <p className="text-[var(--color-text-muted)] mb-6">
            Your recruiter account is pending approval. You&apos;ll be able to post jobs once our team reviews your application.
          </p>
          <Link
            href="/recruiter/pending"
            className="inline-flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-full px-6 py-3 font-medium transition-colors"
          >
            View application status
          </Link>
        </div>
      </div>
    );
  }

  // Not a recruiter or not logged in — show access required screen
  if (!isActiveRecruiter) {
    return (
      <div className="hero-gradient min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
            Recruiter Access Required
          </p>
          <h1 className="font-serif text-4xl text-[var(--color-text-main)] mb-4">
            Post jobs as a <em>verified recruiter</em>
          </h1>
          <p className="text-[var(--color-text-muted)] mb-8 leading-relaxed">
            Job posting is reserved for verified recruiters. Register for access — it&apos;s free, and you&apos;ll also be able to view full candidate profiles.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/recruiter/register"
              className="inline-flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-full px-6 py-3 font-medium transition-colors"
            >
              Apply for recruiter access
            </Link>
            {!isLoggedIn && (
              <Link
                href="/login"
                className="inline-flex items-center justify-center border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] rounded-full px-6 py-3 font-medium transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
          <div className="mt-8 pt-8 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-muted)] mb-3">Looking for work instead?</p>
            <Link
              href="/profiles/new"
              className="text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-secondary-hover)] transition-colors"
            >
              Create a talent profile →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active recruiter — show form
  return (
    <div className="hero-gradient min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-4 block">
            Recruiter Portal
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl text-[var(--color-text-main)] mb-4">
            Post a <em>New</em> Job
          </h1>
          <p className="text-base text-[var(--color-text-muted)]">
            Your listing goes live immediately. Reach verified talent across the UAE.
          </p>
        </div>

        <div className="bg-[var(--color-surface-lowest)] shadow-ambient rounded-2xl p-8">
          <JobForm />
        </div>
      </div>
    </div>
  );
}
