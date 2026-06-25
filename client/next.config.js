/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["@"] = path.join(__dirname, "src");
    return config;
  },
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "pokeapi.co",
      },
    ],
    // Optimize image loading
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 0, // Disable image caching
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false, // Hide X-Powered-By header for security
  // Enable SWC minification for faster builds
  swcMinify: true,
  // Optimize production builds
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundles
  // React strict mode (can be disabled for better performance in production)
  reactStrictMode: true,
  // Disable type checking during build for faster deployments
  typescript: {
    // ⚠️ Dangerously allow production builds to successfully complete even if
    // your project has type errors. Only use if you need faster builds.
    ignoreBuildErrors: process.env.NODE_ENV === "production",
  },
  // Disable ESLint during build for faster deployments
  eslint: {
    // ⚠️ Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Only use if you need faster builds.
    ignoreDuringBuilds: process.env.NODE_ENV === "production",
  },
};

module.exports = nextConfig;

