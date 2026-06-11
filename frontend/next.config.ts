import type { NextConfig } from 'next'
import path from 'path'

const isVercel = !!process.env.VERCEL

const BACKEND_URL = process.env.BACKEND_URL || 'https://nihulo.onrender.com'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
