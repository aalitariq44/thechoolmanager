/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd.top4top.io',
      },
    ],
  },
};

module.exports = nextConfig;
