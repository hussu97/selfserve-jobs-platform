'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { adminDeactivateProfile, adminGetReports } from '@/lib/api';
import type { AdminReportItem } from '@/lib/types';

const ENTITY_TYPE_OPTIONS = ['', 'job', 'profile'];
const STATUS_OPTIONS = ['', 'pending', 'resolved', 'dismissed'];

const REASON_COLORS: Record<string, string> = {
  spam: 'bg-yellow-100 text-yellow-800',
  inappropriate: 'bg-red-100 text-red-700',
  misleading: 'bg-orange-100 text-orange-800',
  duplicate: 'bg-gray-100 text-gray-600',
  scam: 'bg-red-200 text-red-900',
  other: 'bg-gray-100 text-gray-600',
};

function ReasonBadge({ reason }: { reason: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${REASON_COLORS[reason] ?? 'bg-gray-100 text-gray-600'}`}>
      {reason}
    </span>
  );
}

export function ReportsTable({ sessionToken }: { sessionToken: string }) {
  const [items, setItems] = useState<AdminReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [actioningProfileCode, setActioningProfileCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGetReports(
        { search: search || undefined, entity_type: entityTypeFilter || undefined, status: statusFilter || undefined, page },
        sessionToken
      );
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [search, entityTypeFilter, statusFilter, page, sessionToken]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function handleDeactivateProfile(report: AdminReportItem) {
    if (report.entity_type !== 'profile') return;
    setActioningProfileCode(report.entity_code);
    setError('');
    setFeedback('');

    try {
      await adminDeactivateProfile(report.entity_code, sessionToken);
      setFeedback(`Profile ${report.entity_code} has been deactivated and its pending reports were resolved.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to deactivate profile.');
    } finally {
      setActioningProfileCode(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search entity code or reporter email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          style={{ backgroundColor: 'var(--color-surface)', border: 'none', color: 'var(--color-text-main)' }}
        />
        <select
          value={entityTypeFilter}
          onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
          className="rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          style={{ backgroundColor: 'var(--color-surface)', border: 'none', color: 'var(--color-text-main)' }}
        >
          {ENTITY_TYPE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s || 'All types'}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          style={{ backgroundColor: 'var(--color-surface)', border: 'none', color: 'var(--color-text-main)' }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s || 'All statuses'}</option>
          ))}
        </select>
      </div>

      {error && <div className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3">{error}</div>}
      {feedback && <div className="text-sm text-green-800 bg-green-50 rounded-xl px-4 py-3">{feedback}</div>}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden shadow-ambient" style={{ backgroundColor: 'var(--color-surface-lowest)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-surface)' }}>
                {['Type', 'Post', 'Reporter', 'Reason', 'Details', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>No reports found.</td></tr>
              ) : (
                items.map((r) => (
                  <tr key={r.report_code} className="transition-colors hover:bg-surface/40" style={{ borderBottom: '1px solid var(--color-surface)' }}>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${r.entity_type === 'job' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {r.entity_type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/${r.entity_type === 'job' ? 'jobs' : 'profiles'}/${r.entity_code}`}
                        target="_blank"
                        className="underline text-xs transition-opacity hover:opacity-70"
                        style={{ color: 'var(--color-secondary)' }}
                      >
                        {r.entity_title ?? r.entity_code}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>{r.reporter_email}</td>
                    <td className="px-5 py-4"><ReasonBadge reason={r.reason} /></td>
                    <td className="px-5 py-4 text-xs max-w-[200px]" style={{ color: 'var(--color-text-muted)' }}>
                      <span title={r.details ?? ''}>
                        {r.details ? (r.details.length > 60 ? r.details.slice(0, 60) + '…' : r.details) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      {r.entity_type === 'profile' ? (
                        <button
                          type="button"
                          onClick={() => handleDeactivateProfile(r)}
                          disabled={actioningProfileCode === r.entity_code}
                          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-secondary)',
                          }}
                        >
                          {actioningProfileCode === r.entity_code ? 'Deactivating…' : 'Deactivate profile'}
                        </button>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition-colors hover:bg-surface" style={{ color: 'var(--color-text-main)' }}>← Prev</button>
        <span className="text-xs">{page} / {totalPages}</span>
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition-colors hover:bg-surface" style={{ color: 'var(--color-text-main)' }}>Next →</button>
      </div>
    </div>
  );
}
