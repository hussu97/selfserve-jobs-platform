import type { MetadataRoute } from 'next';
import { getJobs, getProfiles } from '@/lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jobs4u.app';
const PAGE_SIZE = 200;

// ID encoding:
//   0          → static routes
//   1..50      → jobs pages (page = id)
//   51..100    → profiles pages (page = id - 50)
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
  // Static routes
  if (id === 0) {
    return [
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
  }

  // Jobs pages
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

  // Profiles pages
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
