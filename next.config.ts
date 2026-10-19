import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SQLiteのネイティブ依存を正しい場所から読み込めるよう、アダプタをバンドルしない。
  serverExternalPackages: ["@prisma/adapter-better-sqlite3"],
  turbopack: {
    root: path.join(__dirname),
  },
  allowedDevOrigins: ["strelitzia"],
};

export default nextConfig;
