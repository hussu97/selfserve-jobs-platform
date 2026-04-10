import type { MetadataRoute } from 'next';
import { getJobs, getProfiles } from '@/lib/api';
import { UAE_EMIRATES, EMPLOYMENT_TYPES, TOP_SKILLS } from '@/lib/seo-constants';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hirebridgeuae.com';
const PAGE_SIZE = 200;

// ID encoding:
//   0          → static routes + all programmatic landing pages
//   1..50      → jobs detail pages (paginated by 200)
//   51..100    → profiles detail pages (paginated by 200)
const JOBS_ID_OFFSET = 1;
const PROFILES_ID_OFFSET = 51;

export async function generateSitemaps() {
  const [jobsResult, profilesResult] = await Promise.allSettled([
    getJobs({ page: 1, per_page: PAGE_SIZE }),
    getProfiles({ page: 1, per_page: PAGE_SIZE }),
  ]);

  const jobPageCount =
    jobsResult.status === 'fulfilled' ? jobsResult.value.total_pages : 1;
  const profilePageCount =
    profilesResult.status === 'fulfilled' ? profilesResult.value.total_pages : 1;

  return [
    { id: 0 },
    ...Array.from({ length: jobPageCount }, (_, i) => ({ id: JOBS_ID_OFFSET + i })),
    ...Array.from({ length: profilePageCount }, (_, i) => ({ id: PROFILES_ID_OFFSET + i })),
  ];
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  // Static routes + all programmatic landing pages
  if (id === 0) {
    const now = new Date();

    // Core static pages
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

    // Jobs by emirate
    const emirateJobRoutes: MetadataRoute.Sitemap = UAE_EMIRATES.map((e) => ({
      url: `${BASE_URL}/jobs/in/${e.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    }));

    // Jobs by employment type
    const typeRoutes: MetadataRoute.Sitemap = EMPLOYMENT_TYPES.map((t) => ({
      url: `${BASE_URL}/jobs/type/${t.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    // Jobs by emirate + skill (top 10 skills × 7 emirates = 70 pages)
    const emirateSkillRoutes: MetadataRoute.Sitemap = UAE_EMIRATES.flatMap((e) =>
      TOP_SKILLS.slice(0, 10).map((s) => ({
        url: `${BASE_URL}/jobs/in/${e.slug}/${s.slug}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.75,
      }))
    );

    // Profiles by emirate
    const emirateProfileRoutes: MetadataRoute.Sitemap = UAE_EMIRATES.map((e) => ({
      url: `${BASE_URL}/profiles/in/${e.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.75,
    }));

    // Profiles by skill
    const skillProfileRoutes: MetadataRoute.Sitemap = TOP_SKILLS.map((s) => ({
      url: `${BASE_URL}/profiles/skill/${s.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.75,
    }));

    // Blog posts
    const { BLOG_POSTS } = await import('@/lib/blog-content').catch(() => ({ BLOG_POSTS: [] }));
    const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.dateModified ?? post.datePublished),
      changeFrequency: 'monthly' as const,
      priority: 0.65,
    }));

    return [
      ...staticRoutes,
      ...emirateJobRoutes,
      ...typeRoutes,
      ...emirateSkillRoutes,
      ...emirateProfileRoutes,
      ...skillProfileRoutes,
      ...blogRoutes,
    ];
  }

  // Jobs detail pages
  if (id >= JOBS_ID_OFFSET && id < PROFILES_ID_OFFSET) {
    const page = id - JOBS_ID_OFFSET + 1;
    const result = await getJobs({ page, per_page: PAGE_SIZE }).catch(() => null);
    return (
      result?.items.map((job) => ({
        url: `${BASE_URL}/jobs/${job.code}`,
        lastModified: new Date(job.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })) ?? []
    );
  }

  // Profiles detail pages
  if (id >= PROFILES_ID_OFFSET) {
    const page = id - PROFILES_ID_OFFSET + 1;
    const result = await getProfiles({ page, per_page: PAGE_SIZE }).catch(() => null);
    return (
      result?.items.map((profile) => ({
        url: `${BASE_URL}/profiles/${profile.code}`,
        lastModified: new Date(profile.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })) ?? []
    );
  }

  return [];
}
