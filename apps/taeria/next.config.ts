import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Saída standalone: imagem Docker mínima (server.js + node_modules traçados).
  output: "standalone",
  // Pacotes server-only que não devem ser empacotados pelo bundler.
  serverExternalPackages: ["pino", "pino-pretty"],
};

export default nextConfig;
