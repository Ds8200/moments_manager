import type { NextConfig } from 'next'
import path from 'path'

const isVercel = !!process.env.VERCEL

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  sassOptions: {
    includePaths: [path.resolve(__dirname)],
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
