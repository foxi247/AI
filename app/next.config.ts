import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Required for @webcontainer/api to work
  // These headers enable SharedArrayBuffer and cross-origin isolation
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ]
  },

  // Allow WebContainer iframes
  async rewrites() {
    return []
  },
}

export default nextConfig
