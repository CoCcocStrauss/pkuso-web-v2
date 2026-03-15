import type { NextConfig } from "next";

// Next 16 类型定义中未包含 eslint，但构建仍支持；用 Object.assign 避免 TS2353
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
};
Object.assign(nextConfig, {
  eslint: { ignoreDuringBuilds: true },
});

export default nextConfig;
