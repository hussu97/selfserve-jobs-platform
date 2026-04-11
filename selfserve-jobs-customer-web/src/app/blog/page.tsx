import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { BLOG_POSTS } from '@/lib/blog-content';

export const metadata: Metadata = {
  title: 'UAE Jobs & Careers Blog — Guides, Salaries & Work Culture',
  description:
    'Practical guides for tech professionals working in or moving to the UAE. Covers job hunting in Dubai, UAE work visas, salaries, free zones, and working across the emirates.',
  alternates: { canonical: '/blog' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogIndexPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'hirebridge UAE Blog',
          description:
            'Practical guides for tech professionals navigating the UAE job market',
          url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hirebridgeuae.com'}/blog`,
          publisher: {
            '@type': 'Organization',
            name: 'hirebridge',
            logo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hirebridgeuae.com'}/logo.png`,
          },
        }}
      />

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
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl bg-surface-lowest shadow-ambient hover:-translate-y-1 transition-all duration-200 overflow-hidden"
            >
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
                  <span>{post.readingMinutes} min read · {formatDate(post.datePublished)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

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
