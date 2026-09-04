import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // 不要在專案裡自動生成 AGENTS.md / CLAUDE.md
    agentRules: false
};

export default nextConfig;
