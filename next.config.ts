import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't walk up to other lockfiles on this machine (there is one in the home directory).
  turbopack: {
    root: path.join(process.cwd()),
  },
};

export default nextConfig;
