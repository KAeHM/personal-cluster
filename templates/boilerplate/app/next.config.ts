import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Saída standalone: imagem Docker mínima (server.js + node_modules traçados).
  output: "standalone",
  // Pacotes nativos / server-only que não devem ser empacotados pelo bundler.
  serverExternalPackages: ["argon2", "postgres", "pino", "pino-pretty"],
};

export default nextConfig;
