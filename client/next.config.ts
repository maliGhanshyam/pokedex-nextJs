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
};

export default nextConfig;
