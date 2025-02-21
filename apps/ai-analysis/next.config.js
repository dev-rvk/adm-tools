const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/hybridaction/:path*',
        destination: '/api/hybridaction/:path*',
      },
    ]
  },
}

module.exports = nextConfig

