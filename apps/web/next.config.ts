import type { NextConfig } from 'next';

const config: NextConfig = {
  // Workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: ['@cairn/tokens', '@cairn/contract'],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default config;
