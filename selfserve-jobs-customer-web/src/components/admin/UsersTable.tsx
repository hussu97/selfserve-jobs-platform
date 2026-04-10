'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminGetUsers } from '@/lib/api';
import type { AdminUserItem } from '@/lib/types';

const STATUS_OPTIONS = ['', 'active', 'pending_verification', 'expired', 'under_review', 'removed'];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending_verification: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-gray-100 text-gray-600',
  under_review: 'bg-orange-100 text-orange-800',
  removed: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function UsersTable({ sessionToken }: { sessionToken: string }) {
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGetUsers({ search: search || undefined, status: statusFilter || undefined, page }, sessionToken);
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, sessionToken]);

  useEffect(() => { load(); }, [load]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search name or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          style={{ backgroundColor: 'var(--color-surface)', border: 'none', color: 'var(--color-text-main)' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          style={{ backgroundColor: 'var(--color-surface)', border: 'none', color: 'var(--color-text-main)' }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden shadow-ambient" style={{ backgroundColor: 'var(--color-surface-lowest)' }}>
        {error && (
          <div className="px-6 py-4 text-sm text-red-700 bg-red-50">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-surface)' }}>
                {['Name', 'Email', 'Status', 'Title', 'Verified', 'Views', 'Joined'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    No profiles found.
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u.profile_code} className="transition-colors hover:bg-surface/40" style={{ borderBottom: '1px solid var(--color-surface)' }}>
                    <td className="px-5 py-4 font-medium" style={{ color: 'var(--color-text-main)' }}>{u.person_name}</td>
                    <td className="px-5 py-4" style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                    <td className="px-5 py-4"><StatusBadge status={u.status} /></td>
                    <td className="px-5 py-4" style={{ color: 'var(--color-text-muted)' }}>{u.current_title ?? '—'}</td>
                    <td className="px-5 py-4">
                      {u.email_verified
                        ? <span className="text-green-600 font-medium">✓</span>
                        : <span style={{ color: 'var(--color-text-muted)' }}>✗</span>}
                    </td>
                    <td className="px-5 py-4" style={{ color: 'var(--color-text-muted)' }}>{u.view_count}</td>
                    <td className="px-5 py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} total={total} onPage={setPage} />
    </div>
  );
}

function Pagination({ page, totalPages, total, onPage }: {
  page: number; totalPages: number; total: number; onPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between text-sm" style={{ color: 'var(--color-text-muted)' }}>
      <span>{total} result{total !== 1 ? 's' : ''}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition-colors hover:bg-surface"
          style={{ color: 'var(--color-text-main)' }}
        >
          ← Prev
        </button>
        <span className="text-xs">{page} / {totalPages}</span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition-colors hover:bg-surface"
          style={{ color: 'var(--color-text-main)' }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
