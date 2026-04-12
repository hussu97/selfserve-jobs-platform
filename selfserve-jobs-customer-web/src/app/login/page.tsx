'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { StatusBanner } from '@/components/shared/StatusBanner';
import { loginRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, login } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoggedIn) router.replace('/account');
  }, [isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginRequest(email.trim().toLowerCase());
      if (res.session_token) {
        // Non-production: auto-login
        login(res.session_token, email.trim().toLowerCase());
        router.push('/account');
      } else {
        setSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-gradient min-h-screen flex items-start justify-center pt-20 pb-16 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl text-primary mb-2">
            Sign <em>in</em>
          </h1>
          <p className="text-sm text-text-muted">
            Enter your email and we&apos;ll send you a magic link.
          </p>
        </div>

        <div className="bg-surface-lowest rounded-2xl shadow-ambient p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-heading text-xl text-primary mb-2">Check your email</h2>
              <p className="text-sm text-text-muted mb-6">
                We sent a sign-in link to <strong>{email}</strong>. It expires in 15 minutes. If you don&apos;t see it, check your spam or junk folder.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-sm text-text-muted hover:text-primary transition-colors underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && <StatusBanner type="error" message={error} />}
              <Input
                type="email"
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3.5 rounded-full text-sm font-semibold uppercase tracking-widest text-white bg-primary-btn transition-all hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending…' : 'Send Magic Link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-xs text-text-muted">
          No account needed.{' '}
          <Link href="/" className="hover:text-primary transition-colors underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
