import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { articleSchema } from '@/lib/schema';
import { BLOG_POSTS } from '@/lib/blog-content';
import type { BlogPost, BlogPostListItem, LinkPreview } from '@/lib/types';
import BlogPostTracker from './BlogPostTracker';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const BLOG_REVALIDATE_SECONDS = 24 * 60 * 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchPostFromApi(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/blog/posts/${encodeURIComponent(slug)}`, {
      next: { revalidate: BLOG_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchRecentPostsFromApi(): Promise<BlogPostListItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/blog/posts?per_page=4`, {
      next: { revalidate: BLOG_REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

// Fallback: build a BlogPost-shaped object from static content
function staticPostToApiShape(p: typeof BLOG_POSTS[0]): BlogPost {
  return {
    post_code: p.slug,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: p.content,
    author: p.author,
    tags: p.tags,
    status: 'published',
    featured_image_url: null,
    reading_minutes: p.readingMinutes,
    view_count: 0,
    link_preview: null,
    source: 'internal',
    external_url: null,
    published_at: p.datePublished + 'T00:00:00Z',
    created_at: p.datePublished + 'T00:00:00Z',
    updated_at: (p.dateModified ?? p.datePublished) + 'T00:00:00Z',
  };
}

function staticListToApiShape(p: typeof BLOG_POSTS[0]): BlogPostListItem {
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

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const apiPost = await fetchPostFromApi(slug);
  if (apiPost) {
    return {
      title: apiPost.title,
      description: apiPost.excerpt,
      openGraph: {
        title: apiPost.title,
        description: apiPost.excerpt,
        type: 'article',
        publishedTime: apiPost.created_at,
        modifiedTime: apiPost.updated_at,
        authors: [apiPost.author],
        images: apiPost.featured_image_url ? [{ url: apiPost.featured_image_url }] : undefined,
      },
      alternates: { canonical: `/blog/${slug}` },
    };
  }

  const staticPost = BLOG_POSTS.find((p) => p.slug === slug);
  if (!staticPost) return { title: 'Not Found' };

  return {
    title: staticPost.title,
    description: staticPost.excerpt,
    openGraph: {
      title: staticPost.title,
      description: staticPost.excerpt,
      type: 'article',
      publishedTime: staticPost.datePublished,
      modifiedTime: staticPost.dateModified,
      authors: [staticPost.author],
    },
    alternates: { canonical: `/blog/${slug}` },
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function LinkPreviewCard({ preview, postCode }: { preview: LinkPreview; postCode: string }) {
  return (
    <div className="my-8">
      <p className="text-xs uppercase tracking-widest text-text-muted mb-3 font-semibold">
        Referenced Link
      </p>
      <BlogPostTracker postCode={postCode} type="link">
        <a
          href={preview.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex gap-4 rounded-2xl bg-surface-lowest shadow-ambient hover:-translate-y-0.5 hover:shadow-ambient-hover transition-all p-4 no-underline"
        >
          {preview.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.image}
              alt=""
              aria-hidden="true"
              className="w-20 h-20 object-cover rounded-xl shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
              {preview.domain ?? new URL(preview.url).hostname}
            </p>
            {preview.title && (
              <p className="font-heading text-base text-primary leading-snug mb-1 group-hover:text-primary-hover transition-colors line-clamp-2">
                {preview.title}
              </p>
            )}
            {preview.description && (
              <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                {preview.description}
              </p>
            )}
          </div>
          <svg className="h-4 w-4 text-text-muted shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.25-7.25a.75.75 0 00-1.06-1.06L5.22 13.72a.75.75 0 000 1.06z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M7.25 6.5a.75.75 0 01.75-.75h5.5a.75.75 0 01.75.75v5.5a.75.75 0 01-1.5 0V7.25H8a.75.75 0 01-.75-.75z" clipRule="evenodd" />
          </svg>
        </a>
      </BlogPostTracker>
    </div>
  );
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  // Try API first, fall back to static
  let post: BlogPost | null = await fetchPostFromApi(slug);
  const isFromApi = post !== null;

  if (!post) {
    const staticPost = BLOG_POSTS.find((p) => p.slug === slug);
    if (!staticPost) notFound();
    post = staticPostToApiShape(staticPost);
  }

  // Get related posts
  let otherPosts: BlogPostListItem[] = [];
  if (isFromApi) {
    const apiPosts = await fetchRecentPostsFromApi();
    otherPosts = apiPosts.filter((p) => p.slug !== slug).slice(0, 3);
  } else {
    otherPosts = BLOG_POSTS.filter((p) => p.slug !== slug)
      .slice(0, 3)
      .map(staticListToApiShape);
  }

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hirebridgeuae.com';
  const substackUrl = process.env.NEXT_PUBLIC_SUBSTACK_PUBLICATION_URL;
  const publishedAt = post.published_at ?? post.created_at;

  return (
    <>
      <JsonLd
        data={articleSchema({
          title: post.title,
          description: post.excerpt,
          url: `/blog/${slug}`,
          datePublished: publishedAt,
          dateModified: post.updated_at,
          authorName: post.author,
        })}
      />

      {/* Track view client-side */}
      {isFromApi && <BlogPostTracker postCode={post.post_code} type="view" />}

      <div className="hero-gradient">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <Breadcrumbs
            items={[
              { label: 'Blog', href: '/blog' },
              { label: post.title },
            ]}
          />
          {post.featured_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-56 sm:h-72 object-cover rounded-2xl mb-6"
            />
          )}
          <div className="mb-8">
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface text-text-muted hover:bg-surface-lowest transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl text-primary mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span>By <strong className="text-text-main">{post.author}</strong></span>
              <span>·</span>
              <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
              <span>·</span>
              <span>{post.reading_minutes} min read</span>
              {post.source === 'substack' && (
                <>
                  <span>·</span>
                  <span>Substack</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Article body */}
        <article className="prose max-w-none mb-8">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>

        {/* Link preview */}
        {post.link_preview && (
          <LinkPreviewCard preview={post.link_preview} postCode={post.post_code} />
        )}

        {(post.external_url || substackUrl) && (
          <div className="rounded-2xl bg-surface-lowest p-6 sm:p-8 shadow-ambient mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary mb-2">
              Field notes
            </p>
            <h2 className="font-heading text-xl text-primary mb-2">
              Keep reading with hirebridge on Substack
            </h2>
            <p className="text-sm text-text-muted leading-relaxed mb-5">
              Company stories, market notes, and practical job-search guidance for professionals across the region.
            </p>
            <div className="flex flex-wrap gap-3">
              {post.external_url && (
                <a
                  href={post.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors"
                >
                  Read on Substack
                </a>
              )}
              {substackUrl && (
                <a
                  href={substackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-full bg-surface text-primary font-semibold text-sm hover:bg-accent/15 transition-colors"
                >
                  Subscribe
                </a>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl bg-primary p-6 sm:p-8 text-white mb-16 mt-8">
          <h2 className="font-heading text-xl mb-2">
            Ready to find your next UAE tech role?
          </h2>
          <p className="text-sm opacity-80 mb-5">
            Browse active jobs in Dubai, Abu Dhabi, and across the Emirates — no signup required.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/jobs/in/dubai"
              className="px-5 py-2.5 rounded-full bg-white text-primary font-semibold text-sm hover:bg-surface transition-colors"
            >
              Jobs in Dubai
            </Link>
            <Link
              href="/jobs/in/abu-dhabi"
              className="px-5 py-2.5 rounded-full bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              Jobs in Abu Dhabi
            </Link>
            <Link
              href="/jobs"
              className="px-5 py-2.5 rounded-full bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              All UAE Jobs
            </Link>
          </div>
        </div>

        {/* More posts */}
        {otherPosts.length > 0 && (
          <section>
            <h2 className="font-heading text-xl text-primary mb-6">More from the Blog</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {otherPosts.map((p) => (
                <Link
                  key={p.post_code}
                  href={`/blog/${p.slug}`}
                  className="group block rounded-2xl bg-surface-lowest shadow-ambient hover:-translate-y-0.5 transition-transform p-5"
                >
                  <h3 className="font-heading text-sm text-primary mb-1 group-hover:text-primary-hover transition-colors leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-xs text-text-muted">{p.reading_minutes} min read</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
