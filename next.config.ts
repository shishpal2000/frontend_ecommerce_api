"use client";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? true : false,
  },

  reactStrictMode: false,

  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 500,
        aggregateTimeout: 50,
        ignored: /node_modules/,
      };

      // Enable polling for watchpack (Next.js 13+)
      config.snapshot = {
        managedPaths: [],
        immutablePaths: [],
      };
    }
    return config;
  },

  // Additional dev server configuration
  experimental: {
    // Force recompilation on file changes
    forceSwcTransforms: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    domains: ["128.100.10.43", "gulab.local", "shivam-mac.local", "*"],
  },
};

export default nextConfig;
