'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminGetBlogPosts, adminDeleteBlogPost } from '@/lib/api';
import type { AdminBlogPost } from '@/lib/types';
import { BlogPostForm } from './BlogPostForm';

interface Props {
  sessionToken: string;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    published: { bg: '#e8f5e9', text: '#2e7d32' },
    draft: { bg: 'var(--color-surface)', text: 'var(--color-text-muted)' },
    archived: { bg: '#fff3e0', text: '#e65100' },
  };
  const c = colors[status] ?? colors.draft;
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {status}
    </span>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function BlogsTable({ sessionToken }: Props) {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editPost, setEditPost] = useState<AdminBlogPost | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminBlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminGetBlogPosts({ search: search || undefined, status: filterStatus || undefined, page, per_page: 20 }, sessionToken);
      setPosts(result.items);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, page, sessionToken]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSaved = (saved: AdminBlogPost) => {
    setShowForm(false);
    setEditPost(null);
    fetchPosts();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await adminDeleteBlogPost(confirmDelete.post_code, sessionToken);
      setConfirmDelete(null);
      fetchPosts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // Summary metrics
  const totalViews = posts.reduce((sum, p) => sum + p.view_count, 0);
  const totalClicks = posts.reduce((sum, p) => sum + p.link_click_count, 0);
  const publishedCount = posts.filter((p) => p.status === 'published').length;

  return (
    <div>
      {/* Metrics bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Posts', value: total },
          { label: 'Published', value: publishedCount },
          { label: 'Total Views', value: totalViews.toLocaleString() },
          { label: 'Link Clicks', value: totalClicks.toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl p-4 shadow-ambient" style={{ backgroundColor: 'var(--color-surface-lowest)' }}>
            <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
            <p className="font-heading text-2xl" style={{ color: 'var(--color-primary)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search posts…"
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <button
          onClick={() => { setEditPost(null); setShowForm(true); }}
          className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          + New Post
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm mb-4" style={{ backgroundColor: 'var(--color-surface)', color: '#c0392b' }}>
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--color-surface)' }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-lowest)' }}>
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>No blog posts found.</p>
          <button
            onClick={() => { setEditPost(null); setShowForm(true); }}
            className="text-xs font-semibold hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Create the first post
          </button>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden shadow-ambient" style={{ backgroundColor: 'var(--color-surface-lowest)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface)' }}>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--color-text-muted)' }}>Title</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-semibold hidden sm:table-cell" style={{ color: 'var(--color-text-muted)' }}>Status</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-widest font-semibold hidden md:table-cell" style={{ color: 'var(--color-text-muted)' }}>Views</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-widest font-semibold hidden md:table-cell" style={{ color: 'var(--color-text-muted)' }}>Clicks</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-widest font-semibold hidden lg:table-cell" style={{ color: 'var(--color-text-muted)' }}>Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-surface)' }}>
              {posts.map((post) => (
                <tr key={post.post_code} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium leading-snug" style={{ color: 'var(--color-text-main)' }}>
                      {post.title}
                    </div>
                    <div className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {post.slug}
                    </div>
                    {/* Mobile status */}
                    <div className="sm:hidden mt-1">
                      <StatusBadge status={post.status} />
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell" style={{ color: 'var(--color-text-muted)' }}>
                    {post.view_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell" style={{ color: 'var(--color-text-muted)' }}>
                    {post.link_click_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-xs hidden lg:table-cell" style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(post.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg transition-colors hover:bg-surface"
                        title="View post"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <button
                        onClick={() => { setEditPost(post); setShowForm(true); }}
                        className="p-1.5 rounded-lg transition-colors hover:bg-surface"
                        title="Edit post"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(post)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-surface"
                        title="Delete post"
                        style={{ color: '#c0392b' }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Page {page} of {totalPages} · {total} posts
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-full text-xs font-semibold transition-colors disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-full text-xs font-semibold transition-colors disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit form modal */}
      {showForm && (
        <BlogPostForm
          sessionToken={sessionToken}
          editPost={editPost}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditPost(null); }}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(28,28,26,0.5)' }}>
          <div className="rounded-2xl p-6 max-w-sm w-full shadow-ambient" style={{ backgroundColor: 'var(--color-bg)' }}>
            <h3 className="font-heading text-lg mb-2" style={{ color: 'var(--color-primary)' }}>Delete Post?</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
              &ldquo;{confirmDelete.title}&rdquo; will be permanently deleted and cannot be recovered.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#c0392b' }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
