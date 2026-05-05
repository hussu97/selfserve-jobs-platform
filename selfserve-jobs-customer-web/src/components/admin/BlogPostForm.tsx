'use client';

import { useState, useEffect, useRef } from 'react';
import { adminCreateBlogPost, adminUpdateBlogPost, adminFetchLinkPreview } from '@/lib/api';
import type { AdminBlogPost, CreateBlogPostRequest, UpdateBlogPostRequest, LinkPreview } from '@/lib/types';

interface Props {
  sessionToken: string;
  editPost?: AdminBlogPost | null;
  onSaved: (post: AdminBlogPost) => void;
  onCancel: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function estimateReadingMinutes(content: string): number {
  return Math.max(1, Math.round(content.split(/\s+/).length / 200));
}

export function BlogPostForm({ sessionToken, editPost, onSaved, onCancel }: Props) {
  const isEdit = !!editPost;

  const [title, setTitle] = useState(editPost?.title ?? '');
  const [slug, setSlug] = useState(editPost?.slug ?? '');
  const [excerpt, setExcerpt] = useState(editPost?.excerpt ?? '');
  const [content, setContent] = useState(editPost?.content ?? '');
  const [author, setAuthor] = useState(editPost?.author ?? 'Hussain Abbasi');
  const [tagsInput, setTagsInput] = useState((editPost?.tags ?? []).join(', '));
  const [postStatus, setPostStatus] = useState<'draft' | 'published' | 'archived'>(
    (editPost?.status as 'draft' | 'published' | 'archived') ?? 'draft'
  );
  const [featuredImageUrl, setFeaturedImageUrl] = useState(editPost?.featured_image_url ?? '');
  const [readingMinutes, setReadingMinutes] = useState<number>(editPost?.reading_minutes ?? 1);
  const originalLinkPreviewUrl = editPost?.link_preview?.url ?? '';
  const [linkPreviewUrl, setLinkPreviewUrl] = useState(originalLinkPreviewUrl);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(editPost?.link_preview ?? null);
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const didHydrateContent = useRef(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);

  // Auto-generate slug from title (only when not manually edited)
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  // Auto-calculate reading minutes when content changes
  useEffect(() => {
    if (!didHydrateContent.current) {
      didHydrateContent.current = true;
      return;
    }
    if (content) {
      setReadingMinutes(estimateReadingMinutes(content));
    }
  }, [content]);

  const handleFetchPreview = async () => {
    if (!linkPreviewUrl.trim()) return;
    setFetchingPreview(true);
    try {
      const preview = await adminFetchLinkPreview(linkPreviewUrl.trim(), sessionToken);
      setLinkPreview(preview);
    } catch {
      setError('Could not fetch link preview. Check the URL and try again.');
    } finally {
      setFetchingPreview(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      let saved: AdminBlogPost;
      if (isEdit && editPost) {
        const update: UpdateBlogPostRequest = {
          title: title || undefined,
          slug: slug || undefined,
          excerpt: excerpt || undefined,
          content: content || undefined,
          author: author || undefined,
          tags,
          status: postStatus,
          featured_image_url: featuredImageUrl || null,
          reading_minutes: readingMinutes,
          ...(linkPreviewUrl && linkPreviewUrl !== originalLinkPreviewUrl
            ? { link_preview_url: linkPreviewUrl }
            : linkPreview !== editPost.link_preview
            ? { link_preview: linkPreview }
            : {}),
        };
        saved = await adminUpdateBlogPost(editPost.post_code, update, sessionToken);
      } else {
        const create: CreateBlogPostRequest = {
          title,
          slug,
          excerpt,
          content,
          author,
          tags,
          status: postStatus,
          featured_image_url: featuredImageUrl || null,
          reading_minutes: readingMinutes,
          link_preview_url: linkPreviewUrl || null,
        };
        saved = await adminCreateBlogPost(create, sessionToken);
      }
      onSaved(saved);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: 'rgba(28,28,26,0.5)' }}>
      <div className="min-h-screen flex items-start justify-center p-4 sm:p-8">
        <div className="w-full max-w-3xl rounded-2xl shadow-ambient" style={{ backgroundColor: 'var(--color-bg)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--color-surface)' }}>
            <h2 className="font-heading text-xl" style={{ color: 'var(--color-primary)' }}>
              {isEdit ? 'Edit Post' : 'New Blog Post'}
            </h2>
            <button onClick={onCancel} className="p-1 rounded-full hover:bg-surface transition-colors" style={{ color: 'var(--color-text-muted)' }}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--color-surface)', color: '#c0392b' }}>
                {error}
              </div>
            )}

            {/* 01 — Core fields */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-heading italic text-secondary text-2xl leading-none">01</span>
                <span className="text-xs uppercase tracking-widest text-text-muted font-semibold">Post Details</span>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.1em] text-text-muted mb-1.5 font-semibold">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-0 bg-surface text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="How to Find a Tech Job in Dubai"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.1em] text-text-muted mb-1.5 font-semibold">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugManuallyEdited(true); }}
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-0 bg-surface text-text-main font-mono placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="how-to-find-tech-job-dubai"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.1em] text-text-muted mb-1.5 font-semibold">Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  required
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-0 bg-surface text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="A short summary shown in listings and previews."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-text-muted mb-1.5 font-semibold">Author</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl text-sm border-0 bg-surface text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-text-muted mb-1.5 font-semibold">Status</label>
                  <select
                    value={postStatus}
                    onChange={(e) => setPostStatus(e.target.value as 'draft' | 'published' | 'archived')}
                    className="w-full px-4 py-2.5 rounded-xl text-sm border-0 bg-surface text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-text-muted mb-1.5 font-semibold">Tags <span className="normal-case">(comma separated)</span></label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm border-0 bg-surface text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Dubai, Job Search, UAE Tech Market"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-text-muted mb-1.5 font-semibold">Reading Minutes</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={readingMinutes}
                    onChange={(e) => setReadingMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm border-0 bg-surface text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.1em] text-text-muted mb-1.5 font-semibold">Featured Image URL <span className="normal-case">(optional)</span></label>
                <input
                  type="url"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-0 bg-surface text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="https://images.unsplash.com/…"
                />
              </div>
            </div>

            {/* 02 — Content */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-heading italic text-secondary text-2xl leading-none">02</span>
                <span className="text-xs uppercase tracking-widest text-text-muted font-semibold">Content <span className="normal-case font-normal">(Markdown)</span></span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={16}
                className="w-full px-4 py-3 rounded-xl text-sm border-0 bg-surface text-text-main font-mono placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                placeholder="## Introduction&#10;&#10;Write your article in Markdown here…"
              />
              <p className="text-xs text-text-muted">
                Est. {readingMinutes} min read · {content.split(/\s+/).filter(Boolean).length} words
              </p>
            </div>

            {/* 03 — Link Preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-heading italic text-secondary text-2xl leading-none">03</span>
                <span className="text-xs uppercase tracking-widest text-text-muted font-semibold">Link Preview <span className="normal-case font-normal">(optional)</span></span>
              </div>
              <p className="text-xs text-text-muted -mt-1">
                Paste a URL to show a link preview card at the bottom of the post.
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkPreviewUrl}
                  onChange={(e) => setLinkPreviewUrl(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm border-0 bg-surface text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="https://example.com/article"
                />
                <button
                  type="button"
                  onClick={handleFetchPreview}
                  disabled={fetchingPreview || !linkPreviewUrl.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)' }}
                >
                  {fetchingPreview ? 'Fetching…' : 'Fetch'}
                </button>
              </div>

              {linkPreview && (
                <div className="flex gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
                  {linkPreview.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={linkPreview.image} alt="" className="w-16 h-16 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-muted">{linkPreview.domain}</p>
                    <p className="text-sm font-semibold text-text-main line-clamp-1">{linkPreview.title}</p>
                    <p className="text-xs text-text-muted line-clamp-2">{linkPreview.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setLinkPreview(null); setLinkPreviewUrl(''); }}
                    className="p-1 rounded-full hover:bg-surface-lowest transition-colors shrink-0"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
                style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
