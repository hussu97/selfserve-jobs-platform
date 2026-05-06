'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PasskeyButton } from '@/components/passkey/PasskeyButton';
import { adminLogin } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { PasskeyAuthCompleteResponse } from '@/lib/types';

export default function AdminLoginPage() {
  const router = useRouter();
  const { isHydrated, isAdmin, login } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isHydrated && isAdmin) router.replace('/admin/dashboard');
  }, [isHydrated, isAdmin, router]);

  const handlePasskeySuccess = (res: PasskeyAuthCompleteResponse) => {
    if (res.user_type !== 'admin') {
      setError('This email is not authorised for admin access.');
      return;
    }
    login(res.session_token, res.email, res.user_type, null, null);
    router.replace('/admin/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminLogin(email.trim().toLowerCase());
      if (res.url) {
        // Dev mode: show the URL directly
        setDevUrl(res.url);
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="text-center mb-10">
          <span className="font-heading italic text-3xl" style={{ color: 'var(--color-primary)' }}>
            hirebridge
          </span>
          <p className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--color-text-muted)' }}>
            admin portal
          </p>
        </div>

        <div className="rounded-2xl p-8 shadow-ambient" style={{ backgroundColor: 'var(--color-surface-lowest)' }}>
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-heading text-xl mb-2" style={{ color: 'var(--color-primary)' }}>
                {devUrl ? 'Dev mode' : 'Check your email'}
              </h2>
              {devUrl ? (
                <div className="text-left mt-4">
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Magic link (dev — email not sent):
                  </p>
                  <a
                    href={devUrl}
                    className="text-xs break-all underline"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    {devUrl}
                  </a>
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  We sent a sign-in link to <strong>{email}</strong>. It expires in 15 minutes. If you don&apos;t see it, check your spam or junk folder.
                </p>
              )}
              <button
                onClick={() => { setSent(false); setDevUrl(''); setEmail(''); }}
                className="mt-5 text-xs underline transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <h1 className="font-heading text-2xl mb-1" style={{ color: 'var(--color-primary)' }}>
                  Admin <em>sign in</em>
                </h1>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Authorised personnel only.
                </p>
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--color-text-muted)' }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ backgroundColor: 'var(--color-surface)', border: 'none', color: 'var(--color-text-main)' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 rounded-full text-sm font-semibold uppercase tracking-widest text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {loading ? 'Sending…' : 'Send Magic Link'}
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-surface)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>or</span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-surface)' }} />
              </div>

              <PasskeyButton
                email={email}
                adminOnly
                onSuccess={handlePasskeySuccess}
                onError={setError}
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
