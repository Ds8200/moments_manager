import type { NextConfig } from 'next'
import path from 'path'

const isVercel = !!process.env.VERCEL

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://moments-manager.onrender.com'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  sassOptions: {
    includePaths: [path.resolve(__dirname)],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
    ]
  },
  ...(isVercel
    ? {}
    : {
        output: 'standalone',
        outputFileTracingRoot: path.resolve(__dirname),
      }),
  turbopack: {
    root: path.resolve(__dirname),
  },
}

export default nextConfig
