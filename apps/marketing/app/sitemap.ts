import type { MetadataRoute } from "next";
import { getAllAreas } from "@/lib/areas";
import { getAllPosts } from "@/lib/blog";

const BASE = "https://realvian.co.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/areas`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/tools`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/portals`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/portals/landlord`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/portals/investor`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/portals/agent`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/portals/developer`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/list-your-business`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/developers`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const postPages: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.dataDate),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // One entry per area — the programmatic SEO surface
  const areaPages: MetadataRoute.Sitemap = getAllAreas().map((a) => ({
    url: `${BASE}/areas/${a.slug}`,
    lastModified: new Date(a.lastRefreshedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...areaPages, ...postPages];
}
