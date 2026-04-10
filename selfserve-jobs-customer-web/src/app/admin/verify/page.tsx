'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginVerify } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function AdminVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code');
  const { login } = useAuth();

  // Derive initial state from URL — avoids calling setState synchronously inside an effect
  const [state, setState] = useState<'loading' | 'success' | 'error'>(code ? 'loading' : 'error');
  const [error, setError] = useState(code ? '' : 'No token found in the link.');
  const hasRun = useRef(false);

  useEffect(() => {
    if (!code || hasRun.current) return;
    hasRun.current = true;

    loginVerify(code)
      .then((res) => {
        login(res.session_token, res.email, res.user_type ?? null, null, res.recruiter_status ?? null);
        setState('success');
        router.replace('/admin/dashboard');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Verification failed. The link may have expired.');
        setState('error');
      });
  }, [code, login, router]);

  if (state === 'loading') {
    return (
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Signing you in…</p>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Signed in. Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 className="font-heading text-xl mb-2" style={{ color: 'var(--color-primary)' }}>Link expired</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
      <Link
        href="/admin/login"
        className="text-sm underline transition-colors"
        style={{ color: 'var(--color-secondary)' }}
      >
        Back to admin login
      </Link>
    </div>
  );
}

export default function AdminVerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-heading italic text-3xl" style={{ color: 'var(--color-primary)' }}>
            hirebridge
          </span>
          <p className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--color-text-muted)' }}>
            admin portal
          </p>
        </div>
        <div className="rounded-2xl p-8 shadow-ambient" style={{ backgroundColor: 'var(--color-surface-lowest)' }}>
          <Suspense
            fallback={
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
              </div>
            }
          >
            <AdminVerifyContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
