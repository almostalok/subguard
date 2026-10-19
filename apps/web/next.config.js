/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@subguard/ui', '@subguard/types', '@subguard/utils', '@subguard/validation'],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.API_URL || 'http://localhost:4000'}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
