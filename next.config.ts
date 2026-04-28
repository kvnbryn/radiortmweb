import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '141.11.25.59',
        port: '',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;