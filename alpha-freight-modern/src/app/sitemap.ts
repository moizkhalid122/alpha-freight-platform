import type { MetadataRoute } from "next";
import {
  CARRIER_DIRECTORY_IDS,
  getPathChangeFrequency,
  getPathPriority,
  PUBLIC_SITEMAP_PATHS,
  SITE_URL,
  SUPPLIER_DIRECTORY_IDS,
} from "@/lib/sitemap-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: getPathChangeFrequency(path),
    priority: getPathPriority(path),
  }));

  const carrierProfiles: MetadataRoute.Sitemap = CARRIER_DIRECTORY_IDS.map((id) => ({
    url: `${SITE_URL}/directory/${id}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const supplierProfiles: MetadataRoute.Sitemap = SUPPLIER_DIRECTORY_IDS.map((id) => ({
    url: `${SITE_URL}/suppliers/${id}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...carrierProfiles, ...supplierProfiles];
}
