const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // In production the ingress sends /api to the gateway, so the browser only ever uses
  // relative URLs. In development there is no ingress, so forward /api to the gateway here.
  async rewrites() {
    if (!isDev) return [];
    const gateway = process.env.GATEWAY_URL || 'http://localhost:4000';
    return [{ source: '/api/:path*', destination: `${gateway}/api/:path*` }];
  },
};

export default nextConfig;
