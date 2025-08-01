/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    // Only use rewrites in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/parking-image',
          destination: 'http://localhost:8000/check-parking-image',
        },
        {
          source: '/api/parking-text',
          destination: 'http://localhost:8000/check-parking-text',
        },
        {
          source: '/api/parking-location',
          destination: 'http://localhost:8000/check-parking-location',
        },
        {
          source: '/api/followup-question',
          destination: 'http://localhost:8000/followup-question',
        },
      ]
    }
    return [] // No rewrites in production
  },
}

export default nextConfig
