import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this project to avoid detecting the
    // parent-directory package-lock.json as the monorepo root.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
