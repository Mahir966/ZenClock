/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // Trailing slashes ensure GitHub Pages routes work reliably
  trailingSlash: true,
};

export default nextConfig;
