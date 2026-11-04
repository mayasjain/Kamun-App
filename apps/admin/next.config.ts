import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // This app owns its dependencies; the root package only runs convenience scripts.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
