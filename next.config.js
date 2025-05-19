/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure Next.js to handle static HTML files
  reactStrictMode: true,
  trailingSlash: true,
  // Ensure Next.js doesn't try to process HTML files as React components
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Redirect root to index.html
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
    ];
  },
};

module.exports = nextConfig;
