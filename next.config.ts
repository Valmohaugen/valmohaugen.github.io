import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  // `next dev` would otherwise write an AGENTS.md for detected coding agents
  // into this public repo (on by default since Next 16.3).
  agentRules: false,
};

export default nextConfig;
