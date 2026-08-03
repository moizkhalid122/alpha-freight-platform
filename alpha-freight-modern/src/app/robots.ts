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
          "/ops-af-7x9k2/",
          "/carrier/",
          "/supplier/",
          "/auth/login",
          "/auth/signup",
          "/auth/select",
          "/auth/forgot-password",
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
