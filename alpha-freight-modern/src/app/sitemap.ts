import type { MetadataRoute } from "next";
import { blogArticles } from "@/lib/blog-content";
import { careerOpenings } from "@/lib/careers-content";
import { knowledgeBaseArticles } from "@/lib/knowledge-base-content";
import {
  getPathChangeFrequency,
  getPathPriority,
  PUBLIC_SITEMAP_PATHS,
  SERVICE_DETAIL_IDS,
  SITE_URL,
} from "@/lib/sitemap-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: getPathChangeFrequency(path),
    priority: getPathPriority(path),
  }));

  const blogPages: MetadataRoute.Sitemap = blogArticles.map((article) => ({
    url: `${SITE_URL}/blog/${article.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.72,
  }));

  const careerPages: MetadataRoute.Sitemap = careerOpenings.map((opening) => ({
    url: `${SITE_URL}/career/${opening.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.68,
  }));

  const knowledgeBasePages: MetadataRoute.Sitemap = knowledgeBaseArticles.map((article) => ({
    url: `${SITE_URL}/knowledge-base/${article.id}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.66,
  }));

  const servicePages: MetadataRoute.Sitemap = SERVICE_DETAIL_IDS.map((id) => ({
    url: `${SITE_URL}/services/${id}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...blogPages,
    ...careerPages,
    ...knowledgeBasePages,
    ...servicePages,
  ];
}
