import type { NextConfig } from "next";
const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS;

// Next 16 类型定义中未包含 eslint，但构建仍支持；用 Object.assign 避免 TS2353
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: allowedDevOrigins ? allowedDevOrigins.split(',') : [],
};
Object.assign(nextConfig, {
  eslint: { ignoreDuringBuilds: true },
});

export default nextConfig;
