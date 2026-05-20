import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  sassOptions: {
    includePaths: [path.resolve(__dirname)],
  },
  output: 'standalone',
  // Ensures server.js lands at .next/standalone/server.js regardless of turbopack.root
  outputFileTracingRoot: path.resolve(__dirname),
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
}

export default nextConfig
