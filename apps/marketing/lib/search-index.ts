import { getAllAreas } from "./areas";
import { getAllPosts } from "./blog";

export interface SearchItem {
  type: "area" | "report";
  title: string;
  subtitle: string;
  url: string;
  /** Lowercased, pre-joined searchable text - built once, matched many times */
  haystack: string;
}

/**
 * Built server-side (see app/layout.tsx) and passed to the client
 * search component as a prop — the dataset is small enough (roughly
 * 38 areas + ~60 posts, well under 15KB serialized) that a real
 * search API or external service like Algolia would be genuine
 * over-engineering for what this actually needs: instant, client-side
 * substring matching over a static, build-time-known dataset.
 */
export function buildSearchIndex(): SearchItem[] {
  const areaItems: SearchItem[] = getAllAreas().map((a) => ({
    type: "area",
    title: a.district,
    subtitle: `${a.city} · ${a.outcode}`,
    url: `/areas/${a.slug}`,
    haystack: `${a.district} ${a.city} ${a.outcode} ${a.region}`.toLowerCase(),
  }));

  const reportItems: SearchItem[] = getAllPosts().map((p) => ({
    type: "report",
    title: p.title,
    subtitle: p.excerpt,
    url: `/blog/${p.slug}`,
    haystack: `${p.title} ${p.excerpt} ${p.tags.join(" ")}`.toLowerCase(),
  }));

  return [...areaItems, ...reportItems];
}

export interface SearchResult extends SearchItem {
  /** Lower is a better match - title-start matches rank above
   * title-substring matches, which rank above subtitle/tag-only matches. */
  score: number;
}

/**
 * Deliberately simple substring matching, not a fuzzy/typo-tolerant
 * algorithm — for a dataset this size and this specific in intent
 * (people searching for a real place name or a report topic they
 * already have in mind), exact substring matching with sensible
 * ranking is more predictable than fuzzy scoring, and doesn't need a
 * new dependency to implement or reason about.
 */
export function searchIndex(query: string, index: SearchItem[], limit = 8): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  const results: SearchResult[] = [];
  for (const item of index) {
    const titleLower = item.title.toLowerCase();
    let score: number;
    if (titleLower.startsWith(q)) score = 0;
    else if (titleLower.includes(q)) score = 1;
    else if (item.haystack.includes(q)) score = 2;
    else continue;

    results.push({ ...item, score });
  }

  results.sort((a, b) => a.score - b.score || a.title.localeCompare(b.title));
  return results.slice(0, limit);
}
