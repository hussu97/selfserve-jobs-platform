import type { MetadataRoute } from 'next';
import { getJobs, getProfiles } from '@/lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jobs4u.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/profiles`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/jobs/new`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/profiles/new`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Fetch all active jobs and profiles for dynamic routes
  const [jobsResult, profilesResult] = await Promise.allSettled([
    getJobs({ per_page: 500 }),
    getProfiles({ per_page: 500 }),
  ]);

  const jobRoutes: MetadataRoute.Sitemap =
    jobsResult.status === 'fulfilled'
      ? jobsResult.value.items.map((job) => ({
          url: `${BASE_URL}/jobs/${job.code}`,
          lastModified: new Date(job.created_at),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
      : [];

  const profileRoutes: MetadataRoute.Sitemap =
    profilesResult.status === 'fulfilled'
      ? profilesResult.value.items.map((profile) => ({
          url: `${BASE_URL}/profiles/${profile.code}`,
          lastModified: new Date(profile.created_at),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
      : [];

  return [...staticRoutes, ...jobRoutes, ...profileRoutes];
}
