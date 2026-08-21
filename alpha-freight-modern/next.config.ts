import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],
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
      {
        source: "/uk-freight-ai",
        destination: "/ai",
        permanent: true,
      },
      {
        source: "/freight-ai",
        destination: "/ai",
        permanent: true,
      },
      {
        source: "/free-freight-ai",
        destination: "/ai",
        permanent: true,
      },
      {
        source: "/haulage-ai",
        destination: "/ai",
        permanent: true,
      },
      {
        source: "/uk-haulage-ai",
        destination: "/ai",
        permanent: true,
      },
      {
        source: "/rpm-calculator",
        destination: "/ai/rpm-calculator",
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
      {
        protocol: 'https',
        hostname: 'api.mapbox.com',
      },
    ],
  },
};

export default nextConfig;
