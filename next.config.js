/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure Next.js to handle static HTML files
  reactStrictMode: true,
  trailingSlash: false,
  // Ensure Next.js doesn't try to process HTML files as React components
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Configure static file serving
  async rewrites() {
    return [
      // Serve the root as index.html
      {
        source: '/',
        destination: '/index.html',
      },
      // Serve all static files from the public directory
      {
        source: '/:path*',
        destination: '/:path*',
      }
    ];
  },
};

module.exports = nextConfig;
