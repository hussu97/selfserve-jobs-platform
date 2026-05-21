'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/api';
import { BLOG_POSTS } from '@/lib/blog-content';
import type { BlogPostListItem } from '@/lib/types';

type Variant = 'profile-form' | 'sidebar';

function staticToListItem(p: typeof BLOG_POSTS[0]): BlogPostListItem {
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
    source: 'internal',
    external_url: null,
    published_at: p.datePublished + 'T00:00:00Z',
    created_at: p.datePublished + 'T00:00:00Z',
    updated_at: (p.dateModified ?? p.datePublished) + 'T00:00:00Z',
  };
}

export function JobMarketNotes({ variant = 'sidebar' }: { variant?: Variant }) {
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const substackUrl = process.env.NEXT_PUBLIC_SUBSTACK_PUBLICATION_URL;
  const limit = variant === 'profile-form' ? 2 : 3;

  useEffect(() => {
    let active = true;
    getBlogPosts({ per_page: limit })
      .then((result) => {
        if (!active) return;
        const nextPosts = result.items.length > 0 ? result.items : BLOG_POSTS.slice(0, limit).map(staticToListItem);
        setPosts(nextPosts);
      })
      .catch(() => {
        if (active) setPosts(BLOG_POSTS.slice(0, limit).map(staticToListItem));
      });
    return () => {
      active = false;
    };
  }, [limit]);

  if (posts.length === 0 && !substackUrl) return null;

  const isForm = variant === 'profile-form';

  return (
    <section className={`rounded-2xl bg-surface-lowest shadow-ambient ${isForm ? 'p-6 sm:p-7' : 'p-5'}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-secondary mb-2">
        Job market notes
      </p>
      <h2 className={`font-heading text-primary ${isForm ? 'text-2xl mb-2' : 'text-lg mb-2'}`}>
        Sharpen your <em>profile</em>
      </h2>
      <p className="text-sm text-text-muted leading-relaxed mb-5">
        Read company stories and regional hiring guidance before you publish your profile.
      </p>

      {posts.length > 0 && (
        <div className="flex flex-col gap-3 mb-5">
          {posts.map((post) => (
            <Link key={post.post_code} href={`/blog/${post.slug}`} className="group block">
              <p className="font-heading text-sm text-primary leading-snug group-hover:text-primary-hover transition-colors">
                {post.title}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-text-muted mt-1">
                {post.reading_minutes} min read
              </p>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/blog"
          className="inline-flex items-center justify-center rounded-full bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-accent/15"
        >
          Read articles
        </Link>
        {substackUrl && (
          <a
            href={substackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-primary-hover"
          >
            Subscribe
          </a>
        )}
      </div>
    </section>
  );
}
