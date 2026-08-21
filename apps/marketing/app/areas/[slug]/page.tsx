import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllAreas,
  getAreaBySlug,
  isLiveData,
  hasLiveGeography,
  getSimilarAreas,
  fmtPrice,
  fmtRent,
  fmtPct,
  fmtYield,
  scoreVerdict,
} from "@/lib/areas";
import {
  ScoreRing,
  MetricBars,
  StatBlock,
  AreaCard,
  DataNote,
} from "@/components/area-viz";
import { Badge, Button, Card, SectionLabel } from "@/components/ui";
import { LocalServices, OffersBlock } from "@/components/commercial";
import {
  loadApprovedListings,
  loadActiveProducts,
  listingsForArea,
  selectProductsForArea,
  enforceSlotLimit,
} from "@/lib/monetisation";
import { getOverride, mediaUrl, focalStyle } from "@/lib/cms";
import { getCurrentUser } from "@/lib/public-auth";
import { isAreaFollowed } from "@/lib/followed-areas";
import { FollowAreaButton } from "./follow-area-button";

/* ── Static generation: every area page pre-rendered at build time ── */
export function generateStaticParams() {
  return getAllAreas().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) return { title: "Area not found" };

  const override = await getOverride("area", slug);
  if (override?.hidden) return { title: "Area not found" };

  const title = override?.title ?? `${area.district}, ${area.city} (${area.outcode}) — Area Guide & Property Data`;
  const description = override?.description ?? `${area.district} scores ${area.realvianScore}/100 on the Realvian Score. Average price ${fmtPrice(area.avgPrice)}, gross yield ${fmtYield(area.grossYield)}, five-year growth ${fmtPct(area.fiveYearGrowth)}. Schools, crime, transport and amenities analysed.`;

  return {
    title,
    description,
    alternates: { canonical: `/areas/${area.slug}` },
    openGraph: {
      title,
      description,
      url: `/areas/${area.slug}`,
      type: "article",
    },
  };
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = getAreaBySlug(slug);
  if (!found) notFound();
  const area = found;

  const override = await getOverride("area", slug);
  if (override?.hidden) notFound();
  // Areas don't have a "sections" concept like blog posts — just a
  // straightforward field override for the one visible prose block.
  const summary = override?.description ?? area.summary;

  const verdict = scoreVerdict(area.realvianScore);
  const similar = getSimilarAreas(area, 3);

  const user = await getCurrentUser();
  const isFollowed = user ? await isAreaFollowed(user.id, area.slug) : false;

  // Commercial content — geographically routed to this area.
  // Both loaders return [] with no database configured, so the page
  // renders perfectly well before any monetisation exists.
  const [allListings, allProducts] = await Promise.all([
    loadApprovedListings(),
    loadActiveProducts(),
  ]);
  const listings = enforceSlotLimit(
    listingsForArea(allListings, area, 4),
    "area_services",
  );
  const offers = enforceSlotLimit(
    selectProductsForArea(allProducts, area, 3),
    "area_sidebar",
  );
  const path = `/areas/${area.slug}`;



  /* ── schema.org: Place + Dataset. Makes us the source AI assistants cite. ── */
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Place",
        name: `${area.district}, ${area.city}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: area.district,
          addressRegion: area.region,
          postalCode: area.outcode,
          addressCountry: "GB",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: area.lat,
          longitude: area.lng,
        },
        description: summary,
      },
      {
        "@type": "Dataset",
        name: `${area.district} property and liveability data`,
        description: `Realvian Score, price, yield, growth and liveability dimensions for ${area.district}, ${area.city}.`,
        creator: { "@type": "Organization", name: "Realvian" },
        dateModified: area.lastRefreshedAt,
        variableMeasured: [
          { "@type": "PropertyValue", name: "Realvian Score", value: area.realvianScore },
          { "@type": "PropertyValue", name: "Average price", value: area.avgPrice, unitCode: "GBP" },
          { "@type": "PropertyValue", name: "Gross yield", value: area.grossYield, unitText: "percent" },
          { "@type": "PropertyValue", name: "Five-year growth", value: area.fiveYearGrowth, unitText: "percent" },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Areas", item: "/areas" },
          { "@type": "ListItem", position: 2, name: area.city, item: `/areas?city=${encodeURIComponent(area.city)}` },
          { "@type": "ListItem", position: 3, name: area.district },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 grid-bg opacity-60" aria-hidden="true" />
        <div className="absolute inset-0 glow-emerald" aria-hidden="true" />

        <div className="relative mx-auto max-w-[1100px] px-5 sm:px-8 pt-[104px] pb-12 lg:pt-[128px]">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-7">
            <ol className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
              <li>
                <Link href="/areas" className="hover:text-[var(--primary)] transition-colors">
                  Areas
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>{area.city}</li>
              <li aria-hidden="true">/</li>
              <li className="text-[var(--text-secondary)]">{area.district}</li>
            </ol>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-start gap-7">
            <ScoreRing score={area.realvianScore} size={128} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <Badge tone="primary">{area.outcode}</Badge>
                <Badge tone={verdict.tone}>{verdict.label} liveability</Badge>
                <Badge tone="neutral">{area.region}</Badge>
              </div>

              <h1
                className="text-[var(--text-primary)] mb-3"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(36px, 5.5vw, 58px)",
                  lineHeight: 1.02,
                  letterSpacing: "-0.03em",
                  fontWeight: 300,
                }}
              >
                {area.district}
                <span className="text-[var(--text-muted)]">, {area.city}</span>
              </h1>

              <p className="text-[16.5px] leading-[1.65] text-[var(--text-secondary)] max-w-[640px]">
                {summary}
              </p>

              {override?.heroMedia && (
                <div className="mt-6 rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] max-w-[640px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(override.heroMedia)}
                    alt={override.heroMedia.altText}
                    className="w-full h-auto"
                    style={focalStyle(override.heroMedia)}
                  />
                  {override.heroMedia.credit && (
                    <p className="px-4 py-2 text-[11.5px] text-[var(--text-muted)] bg-[var(--bg-subtle)]">
                      {override.heroMedia.credit}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2.5 mt-7">
                <Link href={`/compare?a=${area.slug}`}>
                  <Button variant="primary">Compare this area</Button>
                </Link>
                <FollowAreaButton
                  areaSlug={area.slug}
                  isLoggedIn={Boolean(user)}
                  initiallyFollowed={isFollowed}
                />
                <Link href="/areas">
                  <Button variant="secondary">Browse all areas</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ KEY FIGURES ══════════ */}
      <section className="mx-auto max-w-[1100px] px-5 sm:px-8 py-10">
        <StatBlock
          columns={4}
          stats={[
            { label: "Average price", value: fmtPrice(area.avgPrice) },
            { label: "Average rent", value: fmtRent(area.avgRent) },
            { label: "Gross yield", value: fmtYield(area.grossYield), accent: true },
            {
              label: "5-year growth",
              value: fmtPct(area.fiveYearGrowth),
              accent: true,
            },
          ]}
        />
        <div className="mt-4">
          <StatBlock
            columns={2}
            stats={[
              {
                label: "Investment score",
                value: `${area.investmentScore}/100`,
                hint: "Yield, growth, tenant demand and supply pipeline combined",
              },
              {
                label: "Time on market",
                value: `${area.timeOnMarket} days`,
                hint: "Median across the last twelve months",
              },
            ]}
          />
        </div>
      </section>

      {/* ══════════ DIMENSIONS ══════════ */}
      <section className="border-y border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8 py-16">
          <div className="grid lg:grid-cols-[1fr_340px] gap-12">
            <div>
              <SectionLabel>How we scored it</SectionLabel>
              <h2
                className="text-[var(--text-primary)] mb-3"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(26px, 3.4vw, 38px)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.025em",
                  fontWeight: 300,
                }}
              >
                Six dimensions,
                <br />
                one score.
              </h2>
              <p className="text-[15px] leading-relaxed text-[var(--text-secondary)] mb-9 max-w-[520px]">
                The Realvian Score for {area.district} is a weighted composite of
                the dimensions below, each normalised against national data so
                areas remain comparable across cities.
              </p>

              <MetricBars dimensions={area.dimensions} showDetail />
            </div>

            {/* Highlights / watchouts */}
            <div className="space-y-5">
              <Card className="p-6">
                <h3 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-4"
                    style={{ color: "var(--primary)" }}>
                  Strengths
                </h3>
                <ul className="space-y-3">
                  {area.highlights.map((h) => (
                    <li key={h} className="flex gap-2.5 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                      <span aria-hidden="true" style={{ color: "var(--primary)" }}>
                        ✓
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-4"
                    style={{ color: "var(--color-gold-deep)" }}>
                  Things to weigh
                </h3>
                <ul className="space-y-3">
                  {area.watchouts.map((w) => (
                    <li key={w} className="flex gap-2.5 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                      <span aria-hidden="true" style={{ color: "var(--color-gold)" }}>
                        !
                      </span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ LOCAL SERVICES ══════════ */}
      <section className="mx-auto max-w-[1100px] px-5 sm:px-8 py-14">
        <SectionLabel>Local services</SectionLabel>
        <h2
          className="text-[var(--text-primary)] mb-6"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px, 3vw, 34px)",
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            fontWeight: 300,
          }}
        >
          Businesses serving {area.district}
        </h2>
        <LocalServices
          listings={listings}
          areaName={area.district}
          outcode={area.outcode}
          path={path}
        />
      </section>

      {/* ══════════ RELEVANT OFFERS ══════════ */}
      {offers.length > 0 && (
        <section className="border-y border-[var(--border)] bg-[var(--bg-subtle)]">
          <div className="mx-auto max-w-[1100px] px-5 sm:px-8 py-12">
            <SectionLabel>Related services</SectionLabel>
            <p className="text-[13.5px] text-[var(--text-secondary)] mb-6 max-w-[520px]">
              Partners relevant to buying or investing in {area.district}. We may
              earn a commission if you use these — it never affects the scores
              or rankings above.
            </p>
            <OffersBlock
              products={offers}
              context={{ path, slot: "area_sidebar", outcode: area.outcode }}
            />
          </div>
        </section>
      )}

      {/* ══════════ SIMILAR AREAS ══════════ */}
      <section className="mx-auto max-w-[1100px] px-5 sm:px-8 py-16">
        <SectionLabel>You might also consider</SectionLabel>
        <h2
          className="text-[var(--text-primary)] mb-8"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px, 3vw, 34px)",
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            fontWeight: 300,
          }}
        >
          Areas similar to {area.district}
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {similar.map((s) => (
            <AreaCard key={s.slug} area={s} />
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-[var(--border)]">
          <DataNote date={area.lastRefreshedAt} isLive={isLiveData(area.outcode)} hasGeo={hasLiveGeography(area.outcode)} />
        </div>
      </section>
    </>
  );
}
