'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBanner } from '@/components/shared/StatusBanner';
import { verifyEmail, resendVerification } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/lib/analytics';
import type { VerificationResponse } from '@/lib/types';

type VerifyState = 'idle' | 'loading' | 'success' | 'error' | 'no_code';

export default function VerifyPage() {
  return (
    <div className="hero-gradient min-h-screen">
      <Suspense fallback={
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-base font-medium text-text-main">Loading…</p>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const { login } = useAuth();

  const [state, setState] = useState<VerifyState>('idle');
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Resend form state
  const [resendEmail, setResendEmail] = useState('');
  const [resendEntityType, setResendEntityType] = useState<'job' | 'profile'>('job');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!code) {
      setState('no_code');
      return;
    }

    setState('loading');
    verifyEmail(code)
      .then((res) => {
        setResult(res);
        // Auto-login: verification activates the listing and creates a session
        if (res.session_token && res.email) {
          login(res.session_token, res.email, res.entity_type === 'recruiter' ? 'recruiter' : undefined, undefined, res.recruiter_status);
        }
        trackEvent(`email-verify-success-${res.entity_type ?? 'unknown'}`);
        setState('success');
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Verification failed.';
        setErrorMessage(msg);
        trackEvent('email-verify-fail', { reason: msg });
        setState('error');
      });
  }, [code, login]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResendLoading(true);
    setResendError('');
    setResendMessage('');
    try {
      const res = await resendVerification(resendEmail.trim(), resendEntityType);
      setResendMessage(res.message || 'Verification email sent. Check your inbox.');
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (state === 'no_code') {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-surface">
          <svg className="h-8 w-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="font-heading text-3xl text-primary mb-3">
          Check your email
        </h1>
        <p className="text-sm text-text-muted">
          No verification code found. Check your email for the verification link we sent when you created your listing.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium hover:opacity-70 text-primary"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  if (state === 'loading' || state === 'idle') {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-base font-medium text-text-main">
          Verifying your email…
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Just a moment
        </p>
      </div>
    );
  }

  if (state === 'success' && result) {
    // Recruiter verification → show pending page redirect
    if (result.entity_type === 'recruiter') {
      return (
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-heading text-3xl text-primary mb-3">
            Email <em>verified</em>
          </h1>
          <p className="text-sm mb-8 text-text-muted">
            {result.message || 'Your email has been verified. Your recruiter account is now under review.'}
          </p>
          <Link
            href="/recruiter/pending"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-semibold transition-opacity hover:opacity-90 bg-primary-btn"
          >
            View application status →
          </Link>
        </div>
      );
    }

    const pluralType = result.entity_type === 'job' ? 'jobs' : 'profiles';
    const listingHref =
      result.entity_type && result.code
        ? `/${pluralType}/${result.code}`
        : null;

    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-heading text-3xl text-primary mb-3">
          Your listing is <em>live</em>!
        </h1>
        <p className="text-sm mb-8 text-text-muted">
          {result.message || 'Your listing has been verified and published successfully.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {listingHref && (
            <Link
              href={listingHref}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-semibold transition-opacity hover:opacity-90 bg-primary-btn"
            >
              View your listing →
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold transition-colors hover:bg-primary hover:text-white bg-surface-lowest shadow-ambient text-primary"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-yellow-100">
          <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="font-heading text-3xl text-primary mb-3">
          Verification link <em>expired</em>
        </h1>
        <p className="text-sm text-text-muted">
          {errorMessage || 'This verification link has expired or is invalid.'}
        </p>
      </div>

      {/* Resend form */}
      <div className="rounded-2xl bg-surface-lowest shadow-ambient p-6">
        <h2 className="font-heading text-xl text-primary mb-1">
          Resend Verification Email
        </h2>
        <p className="text-sm mb-5 text-text-muted">
          Enter the email address you used when creating your listing.
        </p>

        {resendMessage && (
          <StatusBanner type="success" message={resendMessage} className="mb-4" />
        )}
        {resendError && (
          <StatusBanner type="error" message={resendError} className="mb-4" />
        )}

        <form onSubmit={handleResend} className="flex flex-col gap-4">
          <Input
            type="email"
            label="Email address"
            placeholder="you@example.com"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-text-main">
              Listing type
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="entity_type"
                  value="job"
                  checked={resendEntityType === 'job'}
                  onChange={() => setResendEntityType('job')}
                  className="accent-primary"
                />
                <span className="text-sm text-text-main">Job listing</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="entity_type"
                  value="profile"
                  checked={resendEntityType === 'profile'}
                  onChange={() => setResendEntityType('profile')}
                  className="accent-primary"
                />
                <span className="text-sm text-text-main">Talent profile</span>
              </label>
            </div>
          </div>
          <Button type="submit" loading={resendLoading} className="self-start rounded-full">
            Send verification email
          </Button>
        </form>
      </div>
    </div>
  );
}
