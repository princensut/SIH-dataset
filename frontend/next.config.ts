import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large file uploads through the API proxy (50 MB NetCDF files)
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
