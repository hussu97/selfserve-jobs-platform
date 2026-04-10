import type { MetadataRoute } from 'next';
import { getJobs, getProfiles } from '@/lib/api';
import { UAE_EMIRATES, EMPLOYMENT_TYPES, TOP_SKILLS } from '@/lib/seo-constants';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hirebridgeuae.com';
const PAGE_SIZE = 200;

// Revalidate every hour so new listings appear in the sitemap without a full redeploy
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // --- Static pages ---
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/jobs`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/profiles`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/jobs/new`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/profiles/new`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // --- Programmatic landing pages ---
  const emirateJobRoutes: MetadataRoute.Sitemap = UAE_EMIRATES.map((e) => ({
    url: `${BASE_URL}/jobs/in/${e.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  const typeRoutes: MetadataRoute.Sitemap = EMPLOYMENT_TYPES.map((t) => ({
    url: `${BASE_URL}/jobs/type/${t.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const emirateSkillRoutes: MetadataRoute.Sitemap = UAE_EMIRATES.flatMap((e) =>
    TOP_SKILLS.slice(0, 10).map((s) => ({
      url: `${BASE_URL}/jobs/in/${e.slug}/${s.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.75,
    }))
  );

  const emirateProfileRoutes: MetadataRoute.Sitemap = UAE_EMIRATES.map((e) => ({
    url: `${BASE_URL}/profiles/in/${e.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.75,
  }));

  const skillProfileRoutes: MetadataRoute.Sitemap = TOP_SKILLS.map((s) => ({
    url: `${BASE_URL}/profiles/skill/${s.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.75,
  }));

  // --- Blog posts ---
  const { BLOG_POSTS } = await import('@/lib/blog-content').catch(() => ({ BLOG_POSTS: [] }));
  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.dateModified ?? post.datePublished),
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }));

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

  return [
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
}
