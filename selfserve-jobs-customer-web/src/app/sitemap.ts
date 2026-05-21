import type { MetadataRoute } from 'next';
import { getBlogPosts, getJobs, getProfiles } from '@/lib/api';
import { UAE_EMIRATES, EMPLOYMENT_TYPES, TOP_SKILLS } from '@/lib/seo-constants';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hirebridgeuae.com';
const PAGE_SIZE = 200;
const BLOG_PAGE_SIZE = 50;
const STATIC_LAST_MODIFIED = new Date('2026-01-01T00:00:00.000Z');

// Google's per-sitemap limits: 50,000 URLs and 50 MB uncompressed.
// Log a warning if we get close so the team knows to split the sitemap.
const SITEMAP_URL_LIMIT = 50_000;
const SITEMAP_URL_WARN_THRESHOLD = 45_000;

// Revalidate daily to avoid burning ISR write units on a large XML route.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // --- Static pages ---
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: STATIC_LAST_MODIFIED, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/jobs`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/profiles`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/jobs/new`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/profiles/new`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/blog`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // --- Programmatic landing pages ---
  const emirateJobRoutes: MetadataRoute.Sitemap = UAE_EMIRATES.map((e) => ({
    url: `${BASE_URL}/jobs/in/${e.slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  const typeRoutes: MetadataRoute.Sitemap = EMPLOYMENT_TYPES.map((t) => ({
    url: `${BASE_URL}/jobs/type/${t.slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const emirateSkillRoutes: MetadataRoute.Sitemap = UAE_EMIRATES.flatMap((e) =>
    TOP_SKILLS.slice(0, 10).map((s) => ({
      url: `${BASE_URL}/jobs/in/${e.slug}/${s.slug}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'daily' as const,
      priority: 0.75,
    }))
  );

  const emirateProfileRoutes: MetadataRoute.Sitemap = UAE_EMIRATES.map((e) => ({
    url: `${BASE_URL}/profiles/in/${e.slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'daily' as const,
    priority: 0.75,
  }));

  const skillProfileRoutes: MetadataRoute.Sitemap = TOP_SKILLS.map((s) => ({
    url: `${BASE_URL}/profiles/skill/${s.slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'daily' as const,
    priority: 0.75,
  }));

  // --- Blog posts ---
  const { BLOG_POSTS } = await import('@/lib/blog-content').catch(() => ({ BLOG_POSTS: [] }));
  let blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.dateModified ?? post.datePublished),
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }));
  try {
    let page = 1;
    const dynamicBlogRoutes: MetadataRoute.Sitemap = [];
    while (true) {
      const result = await getBlogPosts({ page, per_page: BLOG_PAGE_SIZE });
      dynamicBlogRoutes.push(
        ...result.items.map((post) => ({
          url: `${BASE_URL}/blog/${post.slug}`,
          lastModified: new Date(post.updated_at),
          changeFrequency: 'weekly' as const,
          priority: post.source === 'substack' ? 0.75 : 0.65,
        }))
      );
      if (page >= result.total_pages || result.items.length === 0) break;
      page++;
    }
    if (dynamicBlogRoutes.length > 0) {
      const seen = new Set<string>();
      blogRoutes = [...dynamicBlogRoutes, ...blogRoutes].filter((route) => {
        if (seen.has(route.url)) return false;
        seen.add(route.url);
        return true;
      });
    }
  } catch {
    // API unavailable — keep static fallback blog URLs.
  }

  // --- Dynamic listing pages (all pages, API errors silently skipped) ---
  const jobRoutes: MetadataRoute.Sitemap = [];
  try {
    let page = 1;
    while (true) {
      const result = await getJobs({ page, per_page: PAGE_SIZE });
      jobRoutes.push(
        ...result.items.map((job) => ({
          url: `${BASE_URL}/jobs/${job.code}`,
          lastModified: new Date(job.created_at),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
      );
      if (page >= result.total_pages || result.items.length === 0) break;
      page++;
    }
  } catch {
    // API unavailable — skip dynamic job URLs rather than failing the entire sitemap
  }

  const profileRoutes: MetadataRoute.Sitemap = [];
  try {
    let page = 1;
    while (true) {
      const result = await getProfiles({ page, per_page: PAGE_SIZE });
      profileRoutes.push(
        ...result.items.map((profile) => ({
          url: `${BASE_URL}/profiles/${profile.code}`,
          lastModified: new Date(profile.created_at),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
      );
      if (page >= result.total_pages || result.items.length === 0) break;
      page++;
    }
  } catch {
    // API unavailable — skip dynamic profile URLs rather than failing the entire sitemap
  }

  const allRoutes = [
    ...staticRoutes,
    ...emirateJobRoutes,
    ...typeRoutes,
    ...emirateSkillRoutes,
    ...emirateProfileRoutes,
    ...skillProfileRoutes,
    ...blogRoutes,
    ...jobRoutes,
    ...profileRoutes,
  ];

  if (allRoutes.length >= SITEMAP_URL_WARN_THRESHOLD) {
    console.warn(
      `[sitemap] URL count (${allRoutes.length}) is approaching the 50,000 per-file limit. ` +
        'Consider splitting into multiple sitemaps via generateSitemaps().'
    );
  }

  return allRoutes.slice(0, SITEMAP_URL_LIMIT);
}
