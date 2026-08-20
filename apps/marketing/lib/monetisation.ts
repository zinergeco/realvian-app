/**
 * MONETISATION ENGINE
 *
 * Decides what commercial content appears where, based on:
 *   1. GEOGRAPHY  — a Manchester plumber shows on Manchester area pages
 *   2. CONTEXT    — a mortgage offer shows on affordability content, not
 *                   on a crime-statistics section
 *   3. DENSITY    — hard caps per slot so pages never become ad soup
 *
 * ── WHY MATCHING MATTERS COMMERCIALLY, NOT JUST ETHICALLY ──
 * Untargeted placements convert at a fraction of relevant ones and they
 * degrade the page. Two well-placed offers on a yield article will out-earn
 * eight scattered ones, and won't cost you the trust that makes people
 * come back. Density caps here are a revenue decision as much as a UX one.
 *
 * ── LEGAL, NOT NEGOTIABLE ──
 * Everything paid is labelled. `rel="sponsored nofollow"` on every
 * affiliate link. See CAP Code s.2 and Google's link-attribution guidance.
 */

import type { Area } from "./areas";
import type { BlogPost, PostKind } from "./blog";

/* ══════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════ */
export type ScopeType = "national" | "region" | "city" | "outcode";

export type ListingCategory =
  | "estate_agent"
  | "mortgage_broker"
  | "solicitor"
  | "surveyor"
  | "builder"
  | "removals"
  | "cleaner"
  | "other";

export type ListingTier = "free" | "featured" | "premium";

export interface AffiliateProduct {
  id: string;
  programSlug: string;
  category: string;
  name: string;
  slug: string;
  description: string;
  destinationUrl: string;
  ctaLabel: string;
  imageKey: string | null;
  matchTopics: string[];
  matchPersonas: string[];
  matchPostKinds: PostKind[];
  scopeType: ScopeType;
  scopeValue: string | null;
  priority: number;
}

export interface BusinessListing {
  id: string;
  businessName: string;
  slug: string;
  category: ListingCategory;
  description: string;
  website: string | null;
  phone: string | null;
  outcode: string;
  city: string | null;
  region: string | null;
  tier: ListingTier;
  isPaid: boolean;
  verified: boolean;
  ratingAvg: number | null;
  reviewCount: number;
  logoKey: string | null;
  coverKey: string | null;
}

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  estate_agent: "Estate agents",
  mortgage_broker: "Mortgage brokers",
  solicitor: "Conveyancing solicitors",
  surveyor: "Surveyors",
  builder: "Builders & trades",
  removals: "Removals",
  cleaner: "Cleaning",
  other: "Other services",
};

/* ══════════════════════════════════════════════════════
   1. GEOGRAPHIC ROUTING
   ══════════════════════════════════════════════════════ */

/**
 * Extracts the outcode from a UK postcode.
 * Handles the full valid format range: M20 2RN, SW1A 1AA, B5 5JD, EH3 6QW.
 */
export function toOutcode(postcode: string): string | null {
  const clean = postcode.toUpperCase().replace(/\s+/g, "");
  // Inward code is always exactly 3 chars: digit + 2 letters
  const m = clean.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)(\d[A-Z]{2})$/);
  if (m?.[1]) return m[1];
  // Already an outcode?
  if (/^[A-Z]{1,2}\d{1,2}[A-Z]?$/.test(clean)) return clean;
  return null;
}

/**
 * Resolves a postcode to full geography using the area dataset.
 * This is what makes "add a listing, it appears in the right city" work
 * without anyone tagging pages manually.
 */
export function resolveGeography(
  postcode: string,
  areas: Area[],
): { outcode: string; city: string | null; region: string | null } | null {
  const outcode = toOutcode(postcode);
  if (!outcode) return null;

  const exact = areas.find((a) => a.outcode === outcode);
  if (exact) {
    return { outcode, city: exact.city, region: exact.region };
  }

  // No exact match — fall back to the postcode area prefix (letters only).
  // "M22" isn't in our dataset but "M20" is, so we can still infer Manchester.
  const prefix = outcode.match(/^[A-Z]+/)?.[0];
  if (prefix) {
    const sibling = areas.find((a) => a.outcode.startsWith(prefix));
    if (sibling) {
      return { outcode, city: sibling.city, region: sibling.region };
    }
  }

  return { outcode, city: null, region: null };
}

/** Does this scope apply to this area? */
export function scopeMatchesArea(
  scopeType: ScopeType,
  scopeValue: string | null,
  area: Area,
): boolean {
  switch (scopeType) {
    case "national":
      return true;
    case "region":
      return scopeValue === area.region;
    case "city":
      return scopeValue === area.city;
    case "outcode":
      return scopeValue === area.outcode;
    default:
      return false;
  }
}

/**
 * Which listings show on a given area page.
 *
 * Tier drives reach — that's the paid product:
 *   premium  → whole city
 *   featured → own outcode only
 *   free     → directory only, never on area pages
 */
export function listingsForArea(
  listings: BusinessListing[],
  area: Area,
  limit = 4,
): BusinessListing[] {
  const eligible = listings.filter((l) => {
    if (l.tier === "free") return false;
    if (l.tier === "featured") return l.outcode === area.outcode;
    if (l.tier === "premium") return l.city === area.city;
    return false;
  });

  return eligible
    .sort((a, b) => {
      // Paid above unpaid, then verified, then rating, then review volume
      const tierRank = { premium: 2, featured: 1, free: 0 };
      const t = tierRank[b.tier] - tierRank[a.tier];
      if (t !== 0) return t;
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      const r = (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0);
      if (r !== 0) return r;
      return b.reviewCount - a.reviewCount;
    })
    .slice(0, limit);
}

/** Groups listings by category for the directory view */
export function groupByCategory(
  listings: BusinessListing[],
): { category: ListingCategory; label: string; items: BusinessListing[] }[] {
  const map = new Map<ListingCategory, BusinessListing[]>();
  for (const l of listings) {
    const arr = map.get(l.category) ?? [];
    arr.push(l);
    map.set(l.category, arr);
  }
  return [...map.entries()]
    .map(([category, items]) => ({
      category,
      label: CATEGORY_LABELS[category],
      items,
    }))
    .sort((a, b) => b.items.length - a.items.length);
}

/* ══════════════════════════════════════════════════════
   2. CONTEXTUAL MATCHING
   ══════════════════════════════════════════════════════ */

/**
 * Topic keywords derived from post content. Drives which affiliate
 * products are contextually appropriate.
 *
 * Deliberately keyword-based rather than an embedding model: it's
 * inspectable, deterministic, and when a placement looks wrong you can
 * see exactly why. An opaque relevance model on commercial placements is
 * hard to debug and hard to defend to a partner.
 */
const TOPIC_SIGNALS: Record<string, RegExp> = {
  mortgage: /\b(mortgage|affordab|deposit|lending|borrow|loan|ltv)\b/i,
  investment: /\b(yield|invest|rental income|roi|portfolio|btl|buy-to-let)\b/i,
  moving: /\b(relocat|moving|move to|removal)\b/i,
  schools: /\b(school|ofsted|catchment|education)\b/i,
  survey: /\b(survey|condition report|structural|valuation)\b/i,
  conveyancing: /\b(conveyanc|solicitor|legal|completion|exchange)\b/i,
  insurance: /\b(insur|landlord cover|buildings cover)\b/i,
  renovation: /\b(renovat|refurb|extension|epc|retrofit)\b/i,
  firstTimeBuyer: /\b(first[- ]time buyer|first home|getting on the ladder)\b/i,
};

export function extractTopics(post: BlogPost): string[] {
  const text = [
    post.title,
    post.description,
    ...post.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
  ].join(" ");

  return Object.entries(TOPIC_SIGNALS)
    .filter(([, re]) => re.test(text))
    .map(([topic]) => topic);
}

/**
 * Selects affiliate products for a post.
 *
 * Scoring is additive and explainable:
 *   +3 per matching topic
 *   +2 for matching post kind
 *   +2 for city-scoped match (more specific than national)
 *   +1 for region-scoped match
 *   priority acts as the tiebreak
 *
 * Products scoring zero are NOT shown. An irrelevant placement earns
 * nothing and costs trust — showing it is strictly worse than a gap.
 */
export function selectProductsForPost(
  products: AffiliateProduct[],
  post: BlogPost,
  areas: Area[],
  limit = 2,
): { product: AffiliateProduct; score: number; reasons: string[] }[] {
  const topics = extractTopics(post);
  const postAreas = post.areaSlugs
    .map((s) => areas.find((a) => a.slug === s))
    .filter((a): a is Area => Boolean(a));

  const cities = new Set(postAreas.map((a) => a.city));
  const regions = new Set(postAreas.map((a) => a.region));

  const scored = products.map((p) => {
    let score = 0;
    const reasons: string[] = [];

    const topicHits = p.matchTopics.filter((t) => topics.includes(t));
    if (topicHits.length) {
      score += topicHits.length * 3;
      reasons.push(`topic: ${topicHits.join(", ")}`);
    }

    if (p.matchPostKinds.length && p.matchPostKinds.includes(post.kind)) {
      score += 2;
      reasons.push(`post kind: ${post.kind}`);
    }

    if (p.scopeType === "city" && p.scopeValue && cities.has(p.scopeValue)) {
      score += 2;
      reasons.push(`city: ${p.scopeValue}`);
    } else if (
      p.scopeType === "region" &&
      p.scopeValue &&
      regions.has(p.scopeValue)
    ) {
      score += 1;
      reasons.push(`region: ${p.scopeValue}`);
    } else if (p.scopeType !== "national") {
      // Scoped somewhere else entirely — disqualify
      return { product: p, score: -1, reasons: ["out of scope"] };
    }

    return { product: p, score, reasons };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.product.priority - a.product.priority)
    .slice(0, limit);
}

/** Products appropriate to an area page */
export function selectProductsForArea(
  products: AffiliateProduct[],
  area: Area,
  limit = 3,
): AffiliateProduct[] {
  return products
    .filter((p) => scopeMatchesArea(p.scopeType, p.scopeValue, area))
    .sort((a, b) => {
      // Prefer more specific geography, then priority
      const spec = { outcode: 3, city: 2, region: 1, national: 0 };
      const s = spec[b.scopeType] - spec[a.scopeType];
      if (s !== 0) return s;
      return b.priority - a.priority;
    })
    .slice(0, limit);
}

/* ══════════════════════════════════════════════════════
   3. LINK BUILDING & TRACKING
   ══════════════════════════════════════════════════════ */

/**
 * All outbound commercial links route through /go/[type]/[id] so clicks
 * are recorded before redirecting. This is the only reliable way to know
 * what actually earns — partner dashboards lag and disagree with each other.
 */
export function trackedUrl(
  targetType: "affiliate_product" | "business_listing",
  targetId: string,
  context: { path?: string; slot?: string; outcode?: string; postSlug?: string } = {},
): string {
  const params = new URLSearchParams();
  if (context.path) params.set("from", context.path);
  if (context.slot) params.set("slot", context.slot);
  if (context.outcode) params.set("area", context.outcode);
  if (context.postSlug) params.set("post", context.postSlug);
  const qs = params.toString();
  return `/go/${targetType === "affiliate_product" ? "p" : "l"}/${targetId}${qs ? `?${qs}` : ""}`;
}

/**
 * Attributes required on every commercial outbound link.
 * `sponsored` tells Google the link is paid; `nofollow` is belt-and-braces;
 * `noopener noreferrer` closes the reverse-tabnabbing hole on target=_blank.
 */
export const COMMERCIAL_LINK_ATTRS = {
  rel: "sponsored nofollow noopener noreferrer",
  target: "_blank" as const,
};

/* ══════════════════════════════════════════════════════
   4. DENSITY GOVERNANCE
   ══════════════════════════════════════════════════════ */

/**
 * Hard ceilings per slot. Editors cannot exceed these from the admin panel.
 *
 * The Master Plan commits to capping advertising at 10–15% of page real
 * estate. That commitment is meaningless unless it's enforced in code
 * rather than left to whoever is hitting a revenue target this quarter.
 */
export const SLOT_LIMITS: Record<string, number> = {
  area_sidebar: 3,
  area_services: 4,
  blog_mid: 1,
  blog_footer: 2,
  compare_below: 2,
};

export function enforceSlotLimit<T>(items: T[], slotKey: string): T[] {
  const limit = SLOT_LIMITS[slotKey] ?? 2;
  return items.slice(0, limit);
}

/* ══════════════════════════════════════════════════════
   5. DATA ACCESS
   Returns empty arrays when no database is configured, so the site
   builds and runs perfectly well with zero commercial content.
   ══════════════════════════════════════════════════════ */

export async function loadActiveProducts(): Promise<AffiliateProduct[]> {
  const url = process.env.DATABASE_URL;
  if (!url) return [];
  try {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { max: 2, connect_timeout: 8 });
    const rows = await sql<Record<string, unknown>[]>`
      SELECT p.id, p.name, p.slug, p.description, p.destination_url, p.cta_label,
             p.match_topics, p.match_personas, p.match_post_kinds,
             p.scope_type, p.scope_value, p.priority,
             pr.slug AS program_slug, pr.category,
             m.storage_key AS image_key
      FROM affiliate_products p
      JOIN affiliate_programs pr ON pr.id = p.program_id
      LEFT JOIN media m ON m.id = p.media_id AND m.deleted_at IS NULL
      WHERE p.active = true AND pr.active = true
      ORDER BY p.priority DESC
    `;
    await sql.end();
    return rows.map((r) => ({
      id: String(r.id),
      programSlug: String(r.program_slug),
      category: String(r.category),
      name: String(r.name),
      slug: String(r.slug),
      description: String(r.description),
      destinationUrl: String(r.destination_url),
      ctaLabel: String(r.cta_label ?? "Learn more"),
      imageKey: r.image_key ? String(r.image_key) : null,
      matchTopics: (r.match_topics as string[]) ?? [],
      matchPersonas: (r.match_personas as string[]) ?? [],
      matchPostKinds: ((r.match_post_kinds as string[]) ?? []) as PostKind[],
      scopeType: String(r.scope_type) as ScopeType,
      scopeValue: r.scope_value ? String(r.scope_value) : null,
      priority: Number(r.priority ?? 50),
    }));
  } catch (err) {
    console.error("[monetisation] product load failed:", err);
    return [];
  }
}

export async function loadApprovedListings(): Promise<BusinessListing[]> {
  const url = process.env.DATABASE_URL;
  if (!url) return [];
  try {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { max: 2, connect_timeout: 8 });
    const rows = await sql<Record<string, unknown>[]>`
      SELECT b.id, b.business_name, b.slug, b.category, b.description,
             b.website, b.phone, b.outcode, b.city, b.region,
             b.tier, b.is_paid, b.verified, b.rating_avg, b.review_count,
             lm.storage_key AS logo_key, cm.storage_key AS cover_key
      FROM business_listings b
      LEFT JOIN media lm ON lm.id = b.logo_media_id AND lm.deleted_at IS NULL
      LEFT JOIN media cm ON cm.id = b.media_id AND cm.deleted_at IS NULL
      WHERE b.status = 'approved'
        AND (b.expires_at IS NULL OR b.expires_at > now())
    `;
    await sql.end();
    return rows.map((r) => ({
      id: String(r.id),
      businessName: String(r.business_name),
      slug: String(r.slug),
      category: String(r.category) as ListingCategory,
      description: String(r.description),
      website: r.website ? String(r.website) : null,
      phone: r.phone ? String(r.phone) : null,
      outcode: String(r.outcode),
      city: r.city ? String(r.city) : null,
      region: r.region ? String(r.region) : null,
      tier: String(r.tier) as ListingTier,
      isPaid: Boolean(r.is_paid),
      verified: Boolean(r.verified),
      ratingAvg: r.rating_avg === null ? null : Number(r.rating_avg),
      reviewCount: Number(r.review_count ?? 0),
      logoKey: r.logo_key ? String(r.logo_key) : null,
      coverKey: r.cover_key ? String(r.cover_key) : null,
    }));
  } catch (err) {
    console.error("[monetisation] listing load failed:", err);
    return [];
  }
}
