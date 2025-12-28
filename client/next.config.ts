import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output configuration for production only
  ...(process.env.NODE_ENV === "production" && {
    output: "standalone", // Creates a minimal server for deployment
  }),
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
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false, // Hide X-Powered-By header for security
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

export default nextConfig;
