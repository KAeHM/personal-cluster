import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  serverExternalPackages: ["postgres", "pino", "pino-pretty"],
};

export default nextConfig;
