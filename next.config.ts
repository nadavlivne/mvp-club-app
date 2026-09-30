import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The CSV price book and inspection guide are read from /data on the server.
  outputFileTracingIncludes: {
    '/**': ['./data/**/*'],
  },
}

export default nextConfig
