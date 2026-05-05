'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { getBlogPosts, getBlogTags } from '@/lib/api';
import type { BlogPostListItem } from '@/lib/types';
import { BLOG_POSTS } from '@/lib/blog-content';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function BlogPostCard({ post }: { post: BlogPostListItem }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-2xl bg-surface-lowest shadow-ambient hover:-translate-y-1 transition-all duration-200 overflow-hidden"
    >
      {post.featured_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.featured_image_url}
          alt=""
          aria-hidden="true"
          className="w-full h-40 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
        <h2 className="font-heading text-lg text-primary mb-2 group-hover:text-primary-hover transition-colors">
          {post.title}
        </h2>
        <p className="text-sm text-text-muted leading-relaxed mb-4">{post.excerpt}</p>
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>{post.author}</span>
          <span>{post.reading_minutes} min read · {formatDate(post.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}

// Convert static blog posts to the API shape for fallback
function staticToApiShape(p: typeof BLOG_POSTS[0]): BlogPostListItem {
  return {
    post_code: p.slug,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    author: p.author,
    tags: p.tags,
    status: 'published',
    featured_image_url: null,
    reading_minutes: p.readingMinutes,
    created_at: p.datePublished + 'T00:00:00Z',
    updated_at: (p.dateModified ?? p.datePublished) + 'T00:00:00Z',
  };
}

export default function BlogIndexPage() {
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      const tags = await getBlogTags();
      if (tags.length > 0) {
        setAvailableTags(tags);
      } else {
        // Derive from static posts
        const staticTags = Array.from(new Set(BLOG_POSTS.flatMap((p) => p.tags))).sort();
        setAvailableTags(staticTags);
      }
    } catch {
      const staticTags = Array.from(new Set(BLOG_POSTS.flatMap((p) => p.tags))).sort();
      setAvailableTags(staticTags);
    }
  }, []);

  const fetchPosts = useCallback(async (searchVal: string, tagVal: string, pageVal: number) => {
    setLoading(true);
    try {
      const result = await getBlogPosts({ search: searchVal || undefined, tag: tagVal || undefined, page: pageVal, per_page: 12 });
      if (result.total > 0) {
        setPosts(result.items);
        setTotal(result.total);
        setTotalPages(result.total_pages);
      } else if (!searchVal && !tagVal && pageVal === 1) {
        // Fallback to static posts when DB is empty
        const staticPosts = BLOG_POSTS.map(staticToApiShape);
        const filtered = staticPosts;
        setPosts(filtered);
        setTotal(filtered.length);
        setTotalPages(1);
      } else {
        setPosts([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch {
      if (!searchVal && !tagVal && pageVal === 1) {
        const staticPosts = BLOG_POSTS.map(staticToApiShape);
        setPosts(staticPosts);
        setTotal(staticPosts.length);
        setTotalPages(1);
      } else {
        setPosts([]);
        setTotal(0);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    fetchPosts(search, activeTag, page);
  }, [search, activeTag, page, fetchPosts]);

  const handleSearchInput = (val: string) => {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 350);
  };

  const handleTagClick = (tag: string) => {
    const next = activeTag === tag ? '' : tag;
    setActiveTag(next);
    setPage(1);
  };

  const clearFilters = () => {
    setInputValue('');
    setSearch('');
    setActiveTag('');
    setPage(1);
  };

  const hasFilters = search || activeTag;

  return (
    <>
      <div className="hero-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <Breadcrumbs items={[{ label: 'Blog' }]} />
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3 block">
              Resources
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl text-primary mb-3">
              UAE Careers <em>Blog</em>
            </h1>
            <p className="text-text-muted text-base">
              Practical guides for tech professionals working in or moving to the UAE.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
            </svg>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search articles…"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border-0 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Tag filters */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full transition-all font-medium ${
                    activeTag === tag
                      ? 'bg-primary text-white'
                      : 'bg-surface text-text-muted hover:bg-surface-lowest hover:text-primary'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full text-secondary hover:text-secondary-hover transition-colors font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Result count */}
        {!loading && (
          <p className="text-xs text-text-muted mb-5 uppercase tracking-wider">
            {total === 0 ? 'No articles found' : `${total} article${total !== 1 ? 's' : ''}`}
            {activeTag ? ` tagged "${activeTag}"` : ''}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl bg-surface-lowest shadow-ambient p-6 animate-pulse">
                <div className="h-3 bg-surface rounded w-1/3 mb-3" />
                <div className="h-5 bg-surface rounded w-3/4 mb-2" />
                <div className="h-3 bg-surface rounded w-full mb-1" />
                <div className="h-3 bg-surface rounded w-4/5 mb-4" />
                <div className="h-3 bg-surface rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-surface-lowest shadow-ambient">
            <p className="text-text-muted text-sm mb-2">No articles match your search.</p>
            <button
              onClick={clearFilters}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {posts.map((post) => (
              <BlogPostCard key={post.post_code} post={post} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-full text-sm font-medium bg-surface text-text-muted hover:bg-surface-lowest transition-colors disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-text-muted px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-full text-sm font-medium bg-surface text-text-muted hover:bg-surface-lowest transition-colors disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

        {/* Link to main sections */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Link
            href="/jobs"
            className="rounded-2xl bg-surface-lowest shadow-ambient p-5 hover:-translate-y-0.5 transition-transform"
          >
            <p className="font-heading text-base text-primary mb-1">Browse UAE Jobs</p>
            <p className="text-xs text-text-muted">Active listings across all emirates</p>
          </Link>
          <Link
            href="/faq"
            className="rounded-2xl bg-surface-lowest shadow-ambient p-5 hover:-translate-y-0.5 transition-transform"
          >
            <p className="font-heading text-base text-primary mb-1">FAQ</p>
            <p className="text-xs text-text-muted">Answers to common UAE job questions</p>
          </Link>
          <Link
            href="/jobs/in/dubai"
            className="rounded-2xl bg-surface-lowest shadow-ambient p-5 hover:-translate-y-0.5 transition-transform"
          >
            <p className="font-heading text-base text-primary mb-1">Jobs in Dubai</p>
            <p className="text-xs text-text-muted">Dubai tech jobs, filtered and live</p>
          </Link>
        </div>
      </div>
    </>
  );
}
