import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hirebridgeuae.com';

const PRIVATE_PATHS = ['/manage/', '/verify/', '/report/', '/login/', '/account/', '/login/callback/', '/admin/'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: allow everything except private paths
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      // Explicitly allow AI crawlers to index public content for GEO
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'Bytespider',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
