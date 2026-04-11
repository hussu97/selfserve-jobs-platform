import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/stats/script.js',
        destination: 'https://cloud.umami.is/script.js',
      },
      {
        source: '/stats/api/send',
        destination: 'https://cloud.umami.is/api/send',
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
