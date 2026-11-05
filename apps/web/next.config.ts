import type { NextConfig } from 'next';

const config: NextConfig = {
  // Workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: ['@cairn/tokens', '@cairn/contract', '@cairn/ui'],
  poweredByHeader: false,
  reactStrictMode: true,
  // The browser talks to the API on the same address as the page, so there is no cross-site
  // request to configure and, later, sign-in cookies just work. The API address is set per host.
  async rewrites() {
    const api = process.env.CAIRN_API_URL ?? 'http://127.0.0.1:4000';
    return [{ source: '/v1/:path*', destination: `${api}/v1/:path*` }];
  },
};

export default config;
