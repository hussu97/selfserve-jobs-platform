'use client';

import { useCallback, useEffect, useState } from 'react';
import { passkeyDelete, passkeyList } from '@/lib/api';
import { registerPasskey } from '@/hooks/usePasskey';
import { usePasskeySupport } from '@/hooks/usePasskey';
import type { PasskeyItem } from '@/lib/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface PasskeyManagerProps {
  sessionToken: string;
}

export function PasskeyManager({ sessionToken }: PasskeyManagerProps) {
  const supported = usePasskeySupport();
  const [items, setItems] = useState<PasskeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await passkeyList(sessionToken);
      setItems(res.items);
    } catch {
      // silently ignore — passkeys are optional
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    setAdding(true);
    setError('');
    setSuccess('');
    try {
      await registerPasskey(sessionToken, label.trim() || undefined);
      setSuccess('Passkey added successfully.');
      setLabel('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add passkey.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (credentialIdB64: string) => {
    setDeleting(credentialIdB64);
    setError('');
    setSuccess('');
    try {
      await passkeyDelete(sessionToken, credentialIdB64);
      setSuccess('Passkey removed.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove passkey.');
    } finally {
      setDeleting(null);
    }
  };

  if (!supported) return null;

  return (
    <section className="rounded-2xl shadow-ambient p-6 flex flex-col gap-5" style={{ backgroundColor: 'var(--color-surface-lowest)' }}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Passkeys
        </p>
        <h2 className="font-heading text-xl" style={{ color: 'var(--color-primary)' }}>
          Sign in with <em>biometrics</em>
        </h2>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Use Face ID, Touch ID, or Windows Hello to sign in — no magic link needed.
        </p>
      </div>

      {error && <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-700">{error}</div>}
      {success && <div className="rounded-xl px-4 py-3 text-sm bg-green-50 text-green-700">{success}</div>}

      {/* Existing passkeys */}
      {!loading && items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.credential_id_b64}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)', flexShrink: 0 }}>
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-main)' }}>
                    {item.label ?? 'Passkey'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Added {formatDate(item.created_at)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.credential_id_b64)}
                disabled={deleting === item.credential_id_b64}
                className="shrink-0 text-xs font-semibold uppercase tracking-wide text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting === item.credential_id_b64 ? '…' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add passkey */}
      <div className="flex flex-col gap-2.5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--color-text-muted)' }}>
          Add a passkey
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder='Label (e.g. "My iPhone") — optional'
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={100}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            style={{ backgroundColor: 'var(--color-surface)', border: 'none', color: 'var(--color-text-main)' }}
          />
          <button
            onClick={handleAdd}
            disabled={adding}
            className="shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold uppercase tracking-widest text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {adding ? '…' : 'Add'}
          </button>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Your browser will prompt you for Face ID, Touch ID, or your device PIN.
        </p>
      </div>
    </section>
  );
}
