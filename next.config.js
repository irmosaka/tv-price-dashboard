/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
