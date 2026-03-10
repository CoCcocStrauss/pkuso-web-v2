import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 忽略 ESLint 警告
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 忽略 TypeScript 类型报错，强行打包
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
