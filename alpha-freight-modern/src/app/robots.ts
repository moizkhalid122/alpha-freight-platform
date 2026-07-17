import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/sitemap-data";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/carrier/",
          "/supplier/",
          "/auth/",
          "/onboarding",
          "/enroll",
          "/demo",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
