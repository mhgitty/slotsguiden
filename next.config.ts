import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: true,
  // Exclude Studio from static export — it must be dynamic
  outputFileTracingExcludes: { '/studio/[[...tool]]': ['**'] },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
  },
  async redirects() {
    return [
      // Add any old WordPress URL redirects here
      // Example:
      // { source: '/old-wp-path', destination: '/new-path', permanent: true },
    ]
  },
}

export default nextConfig
