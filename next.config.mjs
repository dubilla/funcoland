/** @type {import('next').NextConfig} */
const nextConfig = {
  // These packages can't be both transpiled and treated as external
  // Let's only use one approach
  experimental: {
    serverComponentsExternalPackages: ['undici', 'cheerio', 'howlongtobeat'],
  },
};

export default nextConfig;
