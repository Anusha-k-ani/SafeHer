import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    // Next 16 writes a growing Turbopack cache under .next. This disk has no room for it.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
