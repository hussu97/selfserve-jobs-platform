import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { articleSchema } from '@/lib/schema';
import { BLOG_POSTS } from '@/lib/blog-content';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return { title: 'Not Found' };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      authors: [post.author],
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

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hirebridgeuae.com';

  return (
    <>
      <JsonLd
        data={articleSchema({
          title: post.title,
          description: post.excerpt,
          url: `/blog/${slug}`,
          datePublished: post.datePublished,
          dateModified: post.dateModified,
          authorName: post.author,
        })}
      />

      <div className="hero-gradient">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <Breadcrumbs
            items={[
              { label: 'Blog', href: '/blog' },
              { label: post.title },
            ]}
          />
          <div className="mb-8">
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface text-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl text-primary mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span>By <strong className="text-text-main">{post.author}</strong></span>
              <span>·</span>
              <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
              <span>·</span>
              <span>{post.readingMinutes} min read</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Article body */}
        <article className="prose max-w-none mb-16">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>

        {/* CTA */}
        <div className="rounded-2xl bg-primary p-6 sm:p-8 text-white mb-16">
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
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group block rounded-2xl bg-surface-lowest shadow-ambient hover:-translate-y-0.5 transition-transform p-5"
                >
                  <h3 className="font-heading text-sm text-primary mb-1 group-hover:text-primary-hover transition-colors leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-xs text-text-muted">{p.readingMinutes} min read</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
