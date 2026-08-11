import type { MetadataRoute } from "next";
import { getAllAreas } from "@/lib/areas";

const BASE = "https://realvian.co.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/areas`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];

  // One entry per area — the programmatic SEO surface
  const areaPages: MetadataRoute.Sitemap = getAllAreas().map((a) => ({
    url: `${BASE}/areas/${a.slug}`,
    lastModified: new Date(a.lastRefreshedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...areaPages];
}
