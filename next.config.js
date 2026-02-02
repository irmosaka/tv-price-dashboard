/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/tv-price-dashboard' : '',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.digikala.com',
      },
      {
        protocol: 'https',
        hostname: '*.technolife.ir',
      },
      {
        protocol: 'https',
        hostname: '*.torob.com',
      },
    ],
  },
}

module.exports = nextConfig
