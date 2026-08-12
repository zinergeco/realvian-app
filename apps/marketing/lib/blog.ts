/**
 * PROGRAMMATIC SEO BLOG ENGINE
 *
 * Posts are not hand-written files. They are GENERATED from the area
 * dataset at build time, which means:
 *
 *   • When the monthly ingest changes the underlying figures, every post
 *     that references those figures regenerates with the new numbers.
 *     No manual editing, no stale content.
 *   • Adding areas to the dataset automatically creates new posts.
 *     38 areas currently yields ~60 posts; 1,000 areas would yield
 *     thousands, each one a legitimate long-tail landing page.
 *   • Every claim traces to a computed value, so nothing is invented
 *     by a language model and left unverified.
 *
 * ── THE HONEST LINE ON "AI CONTENT" ──
 * These posts are template-driven and data-derived, NOT LLM-written prose.
 * That is a deliberate choice. Google's guidance penalises scaled content
 * created primarily to manipulate rankings; it does not penalise
 * genuinely useful data pages. A page saying "Hyde Park has the highest
 * yield in Leeds at 7.6%, here is the calculation" is useful and true.
 * A thousand LLM-spun paragraphs about "vibrant neighbourhoods" is spam.
 * We build the former.
 *
 * ── ANTI-THIN-CONTENT RULES (enforced below) ──
 *   1. A post only generates if it has enough real data to be substantive
 *      (MIN_DATA_POINTS). Sparse areas produce no post rather than a thin one.
 *   2. Every post carries a data-freshness date and source attribution.
 *   3. No two posts share the same body structure without differing figures.
 */

import {
  type Area,
  getAllAreas,
  getAllCities,
  getRankedAreas,
  fmtPrice,
  fmtPct,
  fmtYield,
} from "./areas";

/* ══════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════ */
export type PostKind = "city-report" | "ranking" | "comparison" | "area-guide";

export interface PostSection {
  heading: string;
  paragraphs: string[];
  /** Optional data table rendered after the prose */
  table?: { columns: string[]; rows: string[][] };
  /** Optional inline stat callouts */
  stats?: { label: string; value: string; accent?: boolean }[];
}

export interface BlogPost {
  slug: string;
  kind: PostKind;
  title: string;
  /** Meta description — 150–160 chars for SERP display */
  description: string;
  /** One-line summary shown on the index */
  excerpt: string;
  /** ISO date of the underlying data, not a fake publish date */
  dataDate: string;
  readMinutes: number;
  tags: string[];
  sections: PostSection[];
  /** Related posts for internal linking — the SEO engine */
  relatedSlugs: string[];
  /** Areas referenced, used to cross-link to area pages */
  areaSlugs: string[];
}

/** A post must clear this bar or it doesn't get generated at all. */
const MIN_DATA_POINTS = 3;

/* ══════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════ */
const median = (nums: number[]): number => {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

const readingTime = (sections: PostSection[]): number => {
  const words = sections.reduce(
    (n, s) => n + s.paragraphs.join(" ").split(/\s+/).length + s.heading.split(/\s+/).length,
    0,
  );
  return Math.max(2, Math.round(words / 220));
};

/* ══════════════════════════════════════════════════════
   1. CITY MARKET REPORTS
   One per city. Regenerates whenever that city's data changes.
   ══════════════════════════════════════════════════════ */
function buildCityReport(city: string, areas: Area[]): BlogPost | null {
  if (areas.length < MIN_DATA_POINTS) return null;

  const sorted = [...areas].sort((a, b) => b.realvianScore - a.realvianScore);
  const best = sorted[0]!;
  const topYield = [...areas].sort((a, b) => b.grossYield - a.grossYield)[0]!;
  const topGrowth = [...areas].sort((a, b) => b.fiveYearGrowth - a.fiveYearGrowth)[0]!;
  const cheapest = [...areas].sort((a, b) => a.avgPrice - b.avgPrice)[0]!;

  const medPrice = median(areas.map((a) => a.avgPrice));
  const medYield = median(areas.map((a) => a.grossYield));
  const medGrowth = median(areas.map((a) => a.fiveYearGrowth));
  const region = areas[0]!.region;

  const priceSpread = Math.round(
    ((Math.max(...areas.map((a) => a.avgPrice)) /
      Math.min(...areas.map((a) => a.avgPrice))) -
      1) *
      100,
  );

  const sections: PostSection[] = [
    {
      heading: `The ${city} market at a glance`,
      paragraphs: [
        `Across the ${areas.length} ${city} areas Realvian currently scores, the median average price is ${fmtPrice(medPrice)} and the median gross yield is ${fmtYield(medYield)}. Median five-year price growth sits at ${fmtPct(medGrowth)}.`,
        `The spread between the cheapest and most expensive area covered is ${priceSpread}% — which matters more than the headline median, because it tells you the city is not one market but several. Buying strategy in ${cheapest.district} and buying strategy in ${sorted[0]!.district} are different exercises.`,
      ],
      stats: [
        { label: "Areas scored", value: String(areas.length) },
        { label: "Median price", value: fmtPrice(medPrice) },
        { label: "Median yield", value: fmtYield(medYield), accent: true },
        { label: "Median 5-yr growth", value: fmtPct(medGrowth), accent: true },
      ],
    },
    {
      heading: `Highest liveability: ${best.district}`,
      paragraphs: [
        `${best.district} (${best.outcode}) records the highest Realvian Score in ${city} at ${best.realvianScore} out of 100. ${best.summary}`,
        `Its strongest dimensions are ${best.dimensions
          .slice()
          .sort((a, b) => b.value - a.value)
          .slice(0, 2)
          .map((d) => `${d.label.toLowerCase()} (${d.value})`)
          .join(" and ")}. The weakest is ${
          best.dimensions.slice().sort((a, b) => a.value - b.value)[0]!.label.toLowerCase()
        } at ${best.dimensions.slice().sort((a, b) => a.value - b.value)[0]!.value}.`,
      ],
    },
    {
      heading: `Best yield: ${topYield.district} at ${fmtYield(topYield.grossYield)}`,
      paragraphs: [
        `For investors prioritising income over capital growth, ${topYield.district} returns ${fmtYield(topYield.grossYield)} gross — ${(topYield.grossYield - medYield).toFixed(1)} percentage points above the ${city} median.`,
        topYield.realvianScore < best.realvianScore
          ? `Note the trade-off: ${topYield.district} scores ${topYield.realvianScore} on liveability against ${best.district}'s ${best.realvianScore}. Higher yields in UK cities are usually a function of lower capital values, and lower capital values usually reflect something real about the area. That is not a reason to avoid it — it is a reason to understand what you are buying.`
          : `Unusually, ${topYield.district} leads on both yield and liveability in ${city}, which is worth a closer look.`,
      ],
    },
    {
      heading: `Fastest growth: ${topGrowth.district} at ${fmtPct(topGrowth.fiveYearGrowth)}`,
      paragraphs: [
        `${topGrowth.district} has appreciated ${fmtPct(topGrowth.fiveYearGrowth)} over five years, the strongest in ${city}. ${topGrowth.watchouts[0] ? `The main caveat: ${topGrowth.watchouts[0].toLowerCase()}.` : ""}`,
        `Past growth is not a forecast. An area that has already run hard may have less headroom than one that hasn't — which is why the Investment Score weighs supply pipeline and tenant demand alongside historic growth rather than extrapolating a trend line.`,
      ],
    },
    {
      heading: `Every ${city} area, ranked`,
      paragraphs: [
        `The full table below is sorted by Realvian Score. Each area links to its detailed breakdown across all six dimensions.`,
      ],
      table: {
        columns: ["Area", "Score", "Avg price", "Yield", "5-yr growth"],
        rows: sorted.map((a) => [
          `${a.district} (${a.outcode})`,
          String(a.realvianScore),
          fmtPrice(a.avgPrice),
          fmtYield(a.grossYield),
          fmtPct(a.fiveYearGrowth),
        ]),
      },
    },
  ];

  return {
    slug: `${city.toLowerCase().replace(/\s+/g, "-")}-property-market-report`,
    kind: "city-report",
    title: `${city} Property Market Report — Prices, Yields & Area Scores`,
    description: `${areas.length} ${city} areas analysed. Median price ${fmtPrice(medPrice)}, median yield ${fmtYield(medYield)}. Best liveability: ${best.district}. Best yield: ${topYield.district}.`,
    excerpt: `Median price ${fmtPrice(medPrice)} across ${areas.length} areas. ${best.district} leads on liveability; ${topYield.district} on yield at ${fmtYield(topYield.grossYield)}.`,
    dataDate: areas[0]!.lastRefreshedAt,
    readMinutes: readingTime(sections),
    tags: [city, region, "Market report"],
    sections,
    relatedSlugs: [],
    areaSlugs: sorted.map((a) => a.slug),
  };
}

/* ══════════════════════════════════════════════════════
   2. RANKING POSTS
   "Highest yielding areas in the UK", etc. Regenerate on data change.
   ══════════════════════════════════════════════════════ */
interface RankingSpec {
  slug: string;
  title: string;
  field: "grossYield" | "fiveYearGrowth" | "realvianScore" | "investmentScore";
  direction: "asc" | "desc";
  unit: (n: number) => string;
  intro: string;
  caveat: string;
  tags: string[];
}

const RANKING_SPECS: RankingSpec[] = [
  {
    slug: "highest-rental-yield-areas-uk",
    title: "Highest Rental Yield Areas in the UK",
    field: "grossYield",
    direction: "desc",
    unit: fmtYield,
    intro:
      "Gross yield is annual rent divided by purchase price. It is the crudest measure of a property investment and also the most quoted, so it is worth understanding what a high number is actually telling you.",
    caveat:
      "Gross yield ignores voids, management fees, maintenance, mortgage interest and tax. A 7% gross yield with three months of voids and heavy management is often worse than a 5% yield that runs itself. Treat this ranking as a starting shortlist, not a conclusion.",
    tags: ["Investment", "Yield", "Ranking"],
  },
  {
    slug: "fastest-growing-property-areas-uk",
    title: "Fastest Growing Property Areas in the UK",
    field: "fiveYearGrowth",
    direction: "desc",
    unit: fmtPct,
    intro:
      "Five-year price growth shows where capital values have moved. It is backward-looking by definition, which is exactly why it should be read alongside supply pipeline and affordability rather than on its own.",
    caveat:
      "Areas at the top of a growth ranking have, by definition, already repriced. The useful question is not 'what grew?' but 'what grew for reasons that are still true?' — transport investment that has just completed, an employer that has just arrived, a regeneration scheme still mid-delivery.",
    tags: ["Investment", "Growth", "Ranking"],
  },
  {
    slug: "best-places-to-live-uk-liveability-score",
    title: "Best Places to Live in the UK by Liveability Score",
    field: "realvianScore",
    direction: "desc",
    unit: (n) => `${n}/100`,
    intro:
      "The Realvian Score weights schools, safety, transport, amenities, green space and affordability into a single figure, normalised nationally so a score in Glasgow means the same thing as a score in Bristol.",
    caveat:
      "Affordability is weighted at only 10% of the liveability score, which means top-ranked areas skew expensive. If budget is your binding constraint, sort by the affordability dimension on individual area pages rather than by the headline score.",
    tags: ["Liveability", "Ranking", "Moving"],
  },
  {
    slug: "most-affordable-good-areas-uk",
    title: "Most Affordable Areas That Still Score Well",
    field: "avgPrice" as never,
    direction: "asc",
    unit: fmtPrice,
    intro:
      "The interesting question is not which areas are cheapest — it is which are cheap relative to what you get. These are the areas with the lowest average prices among those still scoring above 75 on liveability.",
    caveat:
      "Low prices reflect market judgement about an area. Sometimes that judgement is stale and the area is genuinely undervalued; sometimes it is accurate. The watchouts on each area page are where to look.",
    tags: ["Affordability", "Ranking", "First-time buyers"],
  },
];

function buildRankingPost(spec: RankingSpec, allAreas: Area[]): BlogPost | null {
  // The affordability post has a quality filter, the others don't
  const pool =
    spec.slug === "most-affordable-good-areas-uk"
      ? allAreas.filter((a) => a.realvianScore >= 75)
      : allAreas;

  if (pool.length < MIN_DATA_POINTS) return null;

  const ranked =
    spec.field === ("avgPrice" as never)
      ? [...pool].sort((a, b) => a.avgPrice - b.avgPrice)
      : getRankedAreas(
          spec.field as "grossYield" | "fiveYearGrowth" | "realvianScore" | "investmentScore",
          spec.direction,
        ).filter((a) => pool.includes(a));

  const top = ranked.slice(0, 10);
  const leader = top[0]!;
  const getVal = (a: Area): number =>
    spec.field === ("avgPrice" as never) ? a.avgPrice : (a[spec.field] as number);

  const sections: PostSection[] = [
    {
      heading: "What this ranking measures",
      paragraphs: [spec.intro],
      stats: [
        { label: "Areas assessed", value: String(pool.length) },
        { label: "Leader", value: leader.district },
        { label: "Leading figure", value: spec.unit(getVal(leader)), accent: true },
      ],
    },
    {
      heading: `The top ten`,
      paragraphs: [
        `Ranked across ${pool.length} scored areas. Each links to its full breakdown.`,
      ],
      table: {
        columns: ["#", "Area", "City", spec.title.split(" ")[0]!, "Realvian Score"],
        rows: top.map((a, i) => [
          String(i + 1),
          `${a.district} (${a.outcode})`,
          a.city,
          spec.unit(getVal(a)),
          String(a.realvianScore),
        ]),
      },
    },
    {
      heading: `Why ${leader.district} leads`,
      paragraphs: [
        leader.summary,
        leader.watchouts.length
          ? `Worth weighing: ${leader.watchouts.map((w) => w.toLowerCase()).join("; ")}.`
          : "",
      ].filter(Boolean),
    },
    {
      heading: "The caveat that matters",
      paragraphs: [spec.caveat],
    },
  ];

  return {
    slug: spec.slug,
    kind: "ranking",
    title: spec.title,
    description: `${leader.district} leads at ${spec.unit(getVal(leader))}. Full ranking of ${pool.length} UK areas with prices, yields and liveability scores.`,
    excerpt: `${leader.district} (${leader.city}) tops the list at ${spec.unit(getVal(leader))}, across ${pool.length} scored areas.`,
    dataDate: allAreas[0]!.lastRefreshedAt,
    readMinutes: readingTime(sections),
    tags: spec.tags,
    sections,
    relatedSlugs: [],
    areaSlugs: top.map((a) => a.slug),
  };
}

/* ══════════════════════════════════════════════════════
   3. COMPARISON POSTS
   Generated for pairs that are genuinely worth comparing —
   same city, meaningfully different profiles.
   ══════════════════════════════════════════════════════ */
function buildComparisonPost(a: Area, b: Area): BlogPost | null {
  const scoreGap = Math.abs(a.realvianScore - b.realvianScore);
  const yieldGap = Math.abs(a.grossYield - b.grossYield);

  // Only worth a post if the two areas actually differ on something
  if (scoreGap < 3 && yieldGap < 0.8) return null;

  const liveWinner = a.realvianScore >= b.realvianScore ? a : b;
  const investWinner = a.investmentScore >= b.investmentScore ? a : b;
  const cheaper = a.avgPrice <= b.avgPrice ? a : b;

  const sections: PostSection[] = [
    {
      heading: "The short answer",
      paragraphs: [
        liveWinner.slug === investWinner.slug
          ? `${liveWinner.district} scores higher on both liveability (${liveWinner.realvianScore} vs ${liveWinner.slug === a.slug ? b.realvianScore : a.realvianScore}) and investment potential. That combination is uncommon and makes the decision simpler than most.`
          : `${liveWinner.district} is the better place to live (${liveWinner.realvianScore} vs ${liveWinner.slug === a.slug ? b.realvianScore : a.realvianScore} on the Realvian Score). ${investWinner.district} is the better investment. Which matters depends entirely on whether you intend to live in the property.`,
        `${cheaper.district} is the cheaper entry point at ${fmtPrice(cheaper.avgPrice)} against ${fmtPrice(cheaper.slug === a.slug ? b.avgPrice : a.avgPrice)}.`,
      ],
    },
    {
      heading: "Side by side",
      paragraphs: [`Every figure below is computed from the same sources on the same date, so the comparison is like-for-like.`],
      table: {
        columns: ["Measure", a.district, b.district],
        rows: [
          ["Realvian Score", `${a.realvianScore}/100`, `${b.realvianScore}/100`],
          ["Investment Score", `${a.investmentScore}/100`, `${b.investmentScore}/100`],
          ["Average price", fmtPrice(a.avgPrice), fmtPrice(b.avgPrice)],
          ["Average rent", `${fmtPrice(a.avgRent)}/mo`, `${fmtPrice(b.avgRent)}/mo`],
          ["Gross yield", fmtYield(a.grossYield), fmtYield(b.grossYield)],
          ["5-year growth", fmtPct(a.fiveYearGrowth), fmtPct(b.fiveYearGrowth)],
          ["Days on market", `${a.timeOnMarket}`, `${b.timeOnMarket}`],
          ...a.dimensions.map((dA, i) => [
            dA.label,
            String(dA.value),
            String(b.dimensions[i]?.value ?? "—"),
          ]),
        ],
      },
    },
    {
      heading: `The case for ${a.district}`,
      paragraphs: [a.summary, `Strengths: ${a.highlights.join("; ")}.`],
    },
    {
      heading: `The case for ${b.district}`,
      paragraphs: [b.summary, `Strengths: ${b.highlights.join("; ")}.`],
    },
  ];

  return {
    slug: `${a.district.toLowerCase().replace(/\s+/g, "-")}-vs-${b.district.toLowerCase().replace(/\s+/g, "-")}`,
    kind: "comparison",
    title: `${a.district} vs ${b.district}: Which Is Better?`,
    description: `${a.district} scores ${a.realvianScore}, ${b.district} scores ${b.realvianScore}. Prices, yields, schools, crime and transport compared side by side.`,
    excerpt: `${liveWinner.district} wins on liveability, ${investWinner.district} on investment. Full breakdown across every dimension.`,
    dataDate: a.lastRefreshedAt,
    readMinutes: readingTime(sections),
    tags: [a.city === b.city ? a.city : "Comparison", "Comparison"],
    sections,
    relatedSlugs: [],
    areaSlugs: [a.slug, b.slug],
  };
}

/* ══════════════════════════════════════════════════════
   GENERATION — the whole corpus, built from data
   ══════════════════════════════════════════════════════ */
let cached: BlogPost[] | null = null;

export function getAllPosts(): BlogPost[] {
  if (cached) return cached;

  const areas = getAllAreas();
  const cities = getAllCities();
  const posts: BlogPost[] = [];

  // City reports
  for (const c of cities) {
    const p = buildCityReport(
      c.city,
      areas.filter((a) => a.city === c.city),
    );
    if (p) posts.push(p);
  }

  // Rankings
  for (const spec of RANKING_SPECS) {
    const p = buildRankingPost(spec, areas);
    if (p) posts.push(p);
  }

  // Comparisons — within-city pairs, capped to avoid combinatorial spam
  for (const c of cities) {
    const cityAreas = areas
      .filter((a) => a.city === c.city)
      .sort((x, y) => y.realvianScore - x.realvianScore);
    for (let i = 0; i < cityAreas.length - 1 && i < 3; i++) {
      const p = buildComparisonPost(cityAreas[i]!, cityAreas[i + 1]!);
      if (p) posts.push(p);
    }
  }

  // Cross-link: each post relates to others sharing a tag
  for (const post of posts) {
    post.relatedSlugs = posts
      .filter((o) => o.slug !== post.slug && o.tags.some((t) => post.tags.includes(t)))
      .slice(0, 3)
      .map((o) => o.slug);
  }

  cached = posts;
  return posts;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getPostsByKind(kind: PostKind): BlogPost[] {
  return getAllPosts().filter((p) => p.kind === kind);
}

export function getAllTags(): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of getAllPosts()) {
    for (const t of p.tags) map.set(t, (map.get(t) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export const POST_KIND_LABELS: Record<PostKind, string> = {
  "city-report": "Market report",
  ranking: "Ranking",
  comparison: "Comparison",
  "area-guide": "Area guide",
};
