'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminGetEmailLogs } from '@/lib/api';
import type { AdminEmailLogItem } from '@/lib/types';

const EMAIL_TYPE_OPTIONS = [
  '',
  'verification',
  'login',
  'admin_login',
  'management_links',
  'recruiter_verification',
  'recruiter_approved',
  'recruiter_rejected',
  'admin_report_notification',
  'admin_new_recruiter',
  'expiry_warning',
];

const SUCCESS_OPTIONS = [
  { label: 'All outcomes', value: '' },
  { label: 'Delivered', value: 'true' },
  { label: 'Failed', value: 'false' },
];

const TYPE_COLORS: Record<string, string> = {
  verification: 'bg-[#e8f0e9] text-[#384B3B]',
  login: 'bg-[#e8ecf5] text-[#2c3e6b]',
  admin_login: 'bg-[#e8ecf5] text-[#2c3e6b]',
  management_links: 'bg-[#f0ebe6] text-[#8C4E32]',
  recruiter_verification: 'bg-[#e8f0e9] text-[#384B3B]',
  recruiter_approved: 'bg-[#e0ede0] text-[#2d5c2d]',
  recruiter_rejected: 'bg-[#fce8e8] text-[#8c2222]',
  admin_report_notification: 'bg-[#fdf3e0] text-[#7a5200]',
  admin_new_recruiter: 'bg-[#fdf3e0] text-[#7a5200]',
  expiry_warning: 'bg-[#fef0e0] text-[#8c5000]',
};

function EmailTypeBadge({ type }: { type: string }) {
  const colors = TYPE_COLORS[type] ?? 'bg-surface text-text-muted';
  const label = type.replace(/_/g, ' ');
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors}`}>
      {label}
    </span>
  );
}

function OutcomeBadge({ success }: { success: boolean }) {
  return success ? (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#e0ede0] text-[#2d5c2d]">
      Delivered
    </span>
  ) : (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#fce8e8] text-[#8c2222]">
      Failed
    </span>
  );
}

function formatTs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function EmailLogsTable({ sessionToken }: { sessionToken: string }) {
  const [items, setItems] = useState<AdminEmailLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [emailTypeFilter, setEmailTypeFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const successParam =
        successFilter === 'true' ? true : successFilter === 'false' ? false : undefined;
      const res = await adminGetEmailLogs(
        {
          search: search || undefined,
          email_type: emailTypeFilter || undefined,
          success: successParam,
          page,
          per_page: 50,
        },
        sessionToken
      );
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load email logs.');
    } finally {
      setLoading(false);
    }
  }, [search, emailTypeFilter, successFilter, page, sessionToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search recipient email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          style={{ backgroundColor: 'var(--color-surface)', border: 'none', color: 'var(--color-text-main)' }}
        />
        <select
          value={emailTypeFilter}
          onChange={(e) => { setEmailTypeFilter(e.target.value); setPage(1); }}
          className="rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          style={{ backgroundColor: 'var(--color-surface)', border: 'none', color: 'var(--color-text-main)' }}
        >
          <option value="">All email types</option>
          {EMAIL_TYPE_OPTIONS.filter(Boolean).map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          value={successFilter}
          onChange={(e) => { setSuccessFilter(e.target.value); setPage(1); }}
          className="rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          style={{ backgroundColor: 'var(--color-surface)', border: 'none', color: 'var(--color-text-main)' }}
        >
          {SUCCESS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Summary bar */}
      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {loading ? 'Loading…' : `${total.toLocaleString()} record${total !== 1 ? 's' : ''}`}
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="rounded-2xl shadow-ambient overflow-hidden" style={{ backgroundColor: 'var(--color-surface-lowest)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Recipient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Outcome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    No email log records found.
                  </td>
                </tr>
              )}
              {items.map((item, i) => (
                <tr
                  key={i}
                  style={{
                    borderTop: i > 0 ? '1px solid var(--color-surface)' : undefined,
                    color: 'var(--color-text-main)',
                  }}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {formatTs(item.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <EmailTypeBadge type={item.email_type} />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {item.recipient_email}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {item.entity_code ? (
                      <span>{item.entity_type} / {item.entity_code}</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <OutcomeBadge success={item.success} />
                  </td>
                  <td className="px-4 py-3 text-xs max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {item.success
                      ? item.resend_id
                        ? <span className="font-mono">{item.resend_id}</span>
                        : null
                      : item.error_message
                        ? <span className="text-red-600 truncate block" title={item.error_message}>{item.error_message}</span>
                        : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'var(--color-text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
