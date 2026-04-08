import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jobs4u.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/manage/', '/verify/', '/report/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
