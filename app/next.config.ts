import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // COOP/COEP headers only on /workspace — required by WebContainers
  // Applying globally breaks Supabase auth and external resources
  async headers() {
    return [
      {
        source: '/workspace/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ]
  },
}

export default nextConfig
