'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminGetRecruiters, adminApproveRecruiter, adminRejectRecruiter, adminGetRejectionReasons } from '@/lib/api';
import type { AdminRecruiterItem, RejectionReason } from '@/lib/types';

const STATUS_OPTIONS = ['', 'pending_verification', 'pending_approval', 'active', 'rejected', 'suspended'];

const STATUS_COLORS: Record<string, string> = {
  pending_verification: 'bg-yellow-100 text-yellow-800',
  pending_approval: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-100 text-gray-600',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function RejectModal({
  recruiter,
  reasons,
  onConfirm,
  onCancel,
}: {
  recruiter: AdminRecruiterItem;
  reasons: RejectionReason[];
  onConfirm: (reasonCode: string, comment: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [reasonCode, setReasonCode] = useState(reasons[0]?.code ?? '');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonCode) return;
    setLoading(true);
    setError('');
    try {
      await onConfirm(reasonCode, comment.trim() || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject recruiter.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(28,28,26,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 shadow-ambient" style={{ backgroundColor: 'var(--color-surface-lowest)' }}>
        <h3 className="font-heading text-xl mb-1" style={{ color: 'var(--color-primary)' }}>
          Reject <em>{recruiter.name}</em>
        </h3>
        <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>{recruiter.email}</p>

        {error && <div className="mb-4 text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--color-text-muted)' }}>
              Reason
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              required
              className="rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              style={{ backgroundColor: 'var(--color-surface)', border: 'none', color: 'var(--color-text-main)' }}
            >
              {reasons.map((r) => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--color-text-muted)' }}>
              Comment <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Additional context for internal record…"
              rows={3}
              className="rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              style={{ backgroundColor: 'var(--color-surface)', border: 'none', color: 'var(--color-text-main)' }}
            />
          </div>

          <div className="flex gap-3 mt-1">
            <button
              type="submit"
              disabled={loading || !reasonCode}
              className="flex-1 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#dc2626' }}
            >
              {loading ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-surface"
              style={{ color: 'var(--color-text-main)' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RecruitersTable({ sessionToken }: { sessionToken: string }) {
  const [items, setItems] = useState<AdminRecruiterItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reasons, setReasons] = useState<RejectionReason[]>([]);
  const [rejectTarget, setRejectTarget] = useState<AdminRecruiterItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGetRecruiters({ search: search || undefined, status: statusFilter || undefined, page }, sessionToken);
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recruiters.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, sessionToken]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    adminGetRejectionReasons(sessionToken).then(setReasons).catch(() => {});
  }, [sessionToken]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleApprove = async (code: string) => {
    setActionLoading(code);
    try {
      await adminApproveRecruiter(code, sessionToken);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve recruiter.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (reasonCode: string, comment: string) => {
    if (!rejectTarget) return;
    await adminRejectRecruiter(rejectTarget.recruiter_code, reasonCode, comment || null, sessionToken);
    setRejectTarget(null);
    await load();
  };

  return (
    <div className="flex flex-col gap-4">
      {rejectTarget && (
        <RejectModal
          recruiter={rejectTarget}
          reasons={reasons}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

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

      {error && <div className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3">{error}</div>}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden shadow-ambient" style={{ backgroundColor: 'var(--color-surface-lowest)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-surface)' }}>
                {['Name', 'Email', 'Status', 'LinkedIn', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>No recruiters found.</td></tr>
              ) : (
                items.map((r) => (
                  <tr key={r.recruiter_code} className="transition-colors hover:bg-surface/40" style={{ borderBottom: '1px solid var(--color-surface)' }}>
                    <td className="px-5 py-4 font-medium" style={{ color: 'var(--color-text-main)' }}>{r.name}</td>
                    <td className="px-5 py-4" style={{ color: 'var(--color-text-muted)' }}>{r.email}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={r.status} />
                        {r.rejection_reason_code && (
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {r.rejection_reason_code.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <a
                        href={r.linkedin_profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors hover:opacity-80"
                        style={{ backgroundColor: '#0a66c2', color: '#fff' }}
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                        View
                      </a>
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      {r.status === 'pending_approval' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(r.recruiter_code)}
                            disabled={actionLoading === r.recruiter_code}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                          >
                            {actionLoading === r.recruiter_code ? '…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setRejectTarget(r)}
                            disabled={actionLoading === r.recruiter_code}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                            style={{ backgroundColor: '#dc2626' }}
                          >
                            Reject
                          </button>
                        </div>
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
