import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a minimal, self-contained server bundle (.next/standalone) so the
  // production Docker image only needs to ship a small subset of files
  // instead of the full node_modules tree.
  output: "standalone",
};

export default nextConfig;
