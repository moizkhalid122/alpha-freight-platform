import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/pages/legal/privacy.html",
        destination: "/privacy-policy",
        permanent: true,
      },
      {
        source: "/pages/legal/privacy",
        destination: "/privacy-policy",
        permanent: true,
      },
      {
        source: "/pages/legal/terms.html",
        destination: "/terms-of-service",
        permanent: true,
      },
      {
        source: "/pages/legal/terms",
        destination: "/terms-of-service",
        permanent: true,
      },
      {
        source: "/pages/legal/cookie-policy.html",
        destination: "/cookie-policy",
        permanent: true,
      },
      {
        source: "/pages/legal/cookie-policy",
        destination: "/cookie-policy",
        permanent: true,
      },
      {
        source: "/pages/privacy.html",
        destination: "/privacy-policy",
        permanent: true,
      },
      {
        source: "/pages/terms.html",
        destination: "/terms-of-service",
        permanent: true,
      },
      {
        source: "/pages/account-deletion.html",
        destination: "/account-deletion",
        permanent: true,
      },
      {
        source: "/pages/legal/account-deletion.html",
        destination: "/account-deletion",
        permanent: true,
      },
    ];
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
