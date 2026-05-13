import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  outputFileTracingIncludes: {
    "/api/og": ["./assets/fonts/**"],
  },
};

export default nextConfig;
