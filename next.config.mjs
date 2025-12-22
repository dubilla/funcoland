/** @type {import('next').NextConfig} */
const nextConfig = {
  // These packages can't be both transpiled and treated as external
  // Let's only use one approach
  experimental: {
    serverComponentsExternalPackages: ['undici', 'cheerio', 'howlongtobeat'],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.igdb.com',
        pathname: '/igdb/image/upload/**',
      },
    ],
  },
};

export default nextConfig;
