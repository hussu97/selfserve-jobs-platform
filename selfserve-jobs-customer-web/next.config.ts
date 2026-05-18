import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Optional compatibility path for older deployments that loaded Umami
      // from /lib/app.js. Event collection now posts directly to Umami Cloud
      // so pageviews do not invoke a Vercel Function for every analytics hit.
      {
        source: '/lib/app.js',
        destination: 'https://cloud.umami.is/script.js',
      },
    ];
  },
  async redirects() {
    return [
      { source: '/recruiter/register', destination: '/hiring/register', permanent: true },
      { source: '/recruiter/pending', destination: '/hiring/pending', permanent: true },
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

  // Tunneling Sentry through the app can turn every envelope into Vercel
  // compute. Keep it opt-in for environments that explicitly need it.
  ...(process.env.NEXT_PUBLIC_SENTRY_TUNNEL_ENABLED === 'true'
    ? { tunnelRoute: '/monitoring' }
    : {}),
});
