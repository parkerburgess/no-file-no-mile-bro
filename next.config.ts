import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mssql", "tedious"],
  transpilePackages: [
    "@parkerburgess/wandering-parker-server",
    "@parkerburgess/wandering-parker-ui",
  ],
};

export default nextConfig;
