import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy the Umami script through a non-analytics-looking path.
      // Events are forwarded server-side via src/app/api/send/route.ts
      // so UAE's deep packet inspection does not intercept them.
      {
        source: '/lib/app.js',
        destination: 'https://cloud.umami.is/script.js',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps in CI only (set SENTRY_AUTH_TOKEN in GitHub secrets)
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,

  // Disable source map upload locally when auth token is absent
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Automatically tree-shake Sentry logger statements in production
  disableLogger: true,

  // Tunnel Sentry requests through /monitoring to bypass ad-blockers
  tunnelRoute: '/monitoring',
});
