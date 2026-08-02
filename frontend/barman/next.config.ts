import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@base-ui/react"],
  allowedDevOrigins: ["192.168.1.111", "localhost"],
};

export default nextConfig;
