/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // این خط رو اضافه کن
  images: {
    unoptimized: true,  // این خط رو اضافه کن
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
