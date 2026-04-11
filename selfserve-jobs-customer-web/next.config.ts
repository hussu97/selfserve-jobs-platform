import type { NextConfig } from 'next';

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

export default nextConfig;
