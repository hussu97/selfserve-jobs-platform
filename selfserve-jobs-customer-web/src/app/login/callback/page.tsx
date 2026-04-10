'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Spinner } from '@/components/ui/Spinner';
import { loginVerify } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const token = searchParams.get('token');

  const [error, setError] = useState(() =>
    !token ? 'No login token found. Please request a new sign-in link.' : ''
  );
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current || !token) return;
    hasRun.current = true;

    loginVerify(token)
      .then((res) => {
        login(res.session_token, res.email, res.user_type, undefined, res.recruiter_status);
        if (res.user_type === 'recruiter') {
          if (res.recruiter_status === 'active') {
            router.replace('/account');
          } else {
            router.replace('/recruiter/pending');
          }
        } else {
          router.replace('/account');
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Login link is invalid or expired.');
      });
  }, [token, login, router]);

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
          <svg className="h-7 w-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl text-primary mb-2">Link expired</h1>
        <p className="text-sm text-text-muted mb-6">{error}</p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-semibold bg-primary-btn hover:bg-primary transition-colors"
        >
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <Spinner size="lg" className="mx-auto mb-4" />
      <p className="text-base font-medium text-text-main">Signing you in…</p>
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <div className="hero-gradient min-h-screen">
      <Suspense fallback={
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-base font-medium text-text-main">Loading…</p>
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
