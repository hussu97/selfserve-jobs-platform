'use client';

import { useState } from 'react';
import { usePasskeySupport, authenticatePasskey } from '@/hooks/usePasskey';
import type { PasskeyAuthCompleteResponse } from '@/lib/types';

interface PasskeyButtonProps {
  email: string;
  adminOnly?: boolean;
  onSuccess: (res: PasskeyAuthCompleteResponse) => void;
  onError?: (msg: string) => void;
}

export function PasskeyButton({ email, adminOnly = false, onSuccess, onError }: PasskeyButtonProps) {
  const supported = usePasskeySupport();
  const [loading, setLoading] = useState(false);

  if (!supported) return null;

  const handleClick = async () => {
    if (!email.trim()) {
      onError?.('Enter your email first.');
      return;
    }
    setLoading(true);
    try {
      const res = await authenticatePasskey(email.trim().toLowerCase(), adminOnly);
      onSuccess(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Passkey sign-in failed.';
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-full text-sm font-semibold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
      {loading ? 'Verifying…' : 'Sign in with passkey'}
    </button>
  );
}
