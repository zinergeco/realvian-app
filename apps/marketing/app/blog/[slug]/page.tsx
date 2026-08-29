import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllPosts,
  getPostBySlug,
  POST_KIND_LABELS,
} from "@/lib/blog";
import { getAreaBySlug } from "@/lib/areas";
import { AreaCard, DataNote } from "@/components/area-viz";
import { Badge, Card, SectionLabel } from "@/components/ui";
import { CitySkyline, IlloPipeline } from "@/components/illustrations";
import { AffiliateOffer } from "@/components/commercial";
import { RankingChart } from "@/components/ranking-chart";
import {
  loadActiveProducts,
  selectProductsForPost,
} from "@/lib/monetisation";
import { getAllAreas } from "@/lib/areas";
import { getOverride, applyOverride, mediaUrl, focalStyle } from "@/lib/cms";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Report not found" };

  const override = await getOverride("post", slug);
  const resolved = applyOverride(post, override);
  if (resolved.hidden) return { title: "Report not found" };

  return {
    title: resolved.title,
    description: resolved.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: resolved.title,
      description: resolved.description,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.dataDate,
      modifiedTime: post.dataDate,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = getPostBySlug(slug);
  if (!found) notFound();

  const override = await getOverride("post", slug);
  const resolved = applyOverride(found, override);
  if (resolved.hidden) notFound();
  // ResolvedPost extends BlogPost with the same field names, so every
  // existing `post.title` / `post.description` / `post.sections` usage
  // below picks up the override automatically — no further changes needed
  // through the rest of this function.
  const post = resolved;

  const related = post.relatedSlugs
    .map((s) => getPostBySlug(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  // Contextually matched offers. selectProductsForPost scores each product
  // against the post's extracted topics and geography — products scoring
  // zero are not shown at all rather than filling the slot with noise.
  const allProducts = await loadActiveProducts();
  const matched = selectProductsForPost(allProducts, post, getAllAreas(), 2);
  const midOffer = matched[0]?.product ?? null;
  const footOffer = matched[1]?.product ?? null;
  const postPath = `/blog/${post.slug}`;

  const referencedAreas = post.areaSlugs
    .slice(0, 3)
    .map((s) => getAreaBySlug(s))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  /* schema.org Article + Dataset — makes us citable by AI assistants */
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.description,
        datePublished: post.dataDate,
        dateModified: post.dataDate,
        author: { "@type": "Organization", name: "Realvian" },
        publisher: {
          "@type": "Organization",
          name: "Realvian",
          url: "https://realvian.co.uk",
        },
        keywords: post.tags.join(", "),
        isAccessibleForFree: true,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Reports", item: "/blog" },
          { "@type": "ListItem", position: 2, name: post.title },
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
        <div className="absolute inset-0 grid-bg opacity-40" aria-hidden="true" />
        <div className="absolute inset-0 glow-emerald" aria-hidden="true" />
        <div
          className="absolute bottom-0 inset-x-0 pointer-events-none opacity-45"
          style={{ height: 140, maskImage: "linear-gradient(to top, black 55%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, black 55%, transparent 100%)" }}
          aria-hidden="true"
        >
          <CitySkyline
            className="w-full h-full"
            variant={post.kind === "comparison" ? "terraced" : "generic"}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[820px] px-5 sm:px-8 pt-[104px] pb-[112px] lg:pt-[128px]">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
              <li>
                <Link href="/blog" className="hover:text-[var(--primary)] transition-colors">
                  Reports
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[var(--text-secondary)]">
                {POST_KIND_LABELS[post.kind]}
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <Badge tone="primary">{POST_KIND_LABELS[post.kind]}</Badge>
            {post.tags.slice(0, 2).map((t) => (
              <Badge key={t} tone="neutral">
                {t}
              </Badge>
            ))}
            <span className="text-[12.5px] text-[var(--text-muted)]">
              {post.readMinutes} min read
            </span>
          </div>

          <h1
            className="text-[var(--text-primary)]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4.6vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              fontWeight: 300,
            }}
          >
            {post.title}
          </h1>

          <p className="mt-5 text-[17px] leading-[1.65] text-[var(--text-secondary)] max-w-[620px]">
            {post.description}
          </p>

          {resolved.heroMedia && (
            <div className="mt-8 rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] max-w-[820px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(resolved.heroMedia)}
                alt={resolved.heroMedia.altText}
                className="w-full h-auto"
                style={focalStyle(resolved.heroMedia)}
              />
              {resolved.heroMedia.credit && (
                <p className="px-4 py-2 text-[11.5px] text-[var(--text-muted)] bg-[var(--bg-subtle)]">
                  {resolved.heroMedia.credit}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ══════════ BODY ══════════ */}
      <article className="mx-auto max-w-[820px] px-5 sm:px-8 py-14">
        {post.sections.map((section, si) => (
          <div key={section.heading}>
          {/* Mid-article placement: after section 2, where the reader has
              engaged but before the long data tables. One item max. */}
          {si === 2 && midOffer && (
            <AffiliateOffer
              product={midOffer}
              variant="inline"
              context={{ path: postPath, slot: "blog_mid", postSlug: post.slug }}
            />
          )}
          <section className={si > 0 ? "mt-14" : ""}>
            <h2
              className="text-[var(--text-primary)] mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(22px, 2.8vw, 30px)",
                lineHeight: 1.14,
                letterSpacing: "-0.025em",
                fontWeight: 400,
              }}
            >
              {section.heading}
            </h2>

            {section.paragraphs.map((p, pi) => (
              <p
                key={pi}
                className="text-[16px] leading-[1.72] text-[var(--text-secondary)] mb-4"
              >
                {p}
              </p>
            ))}

            {/* Stat callouts */}
            {section.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                {section.stats.map((s) => (
                  <Card key={s.label} className="p-4">
                    <div className="text-[10.5px] tracking-[0.1em] uppercase text-[var(--text-muted)] mb-1.5">
                      {s.label}
                    </div>
                    <div
                      className="tnum text-[18px] font-semibold leading-none"
                      style={{
                        color: s.accent ? "var(--primary)" : "var(--text-primary)",
                      }}
                    >
                      {s.value}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Ranking chart — visual leaderboard above the data table, same values */}
            {section.chart && (
              <div className="mt-6">
                <RankingChart items={section.chart} />
              </div>
            )}

            {/* Data table */}
            {section.table && (
              <div className="mt-6 -mx-5 sm:mx-0 overflow-x-auto">
                <table className="w-full min-w-[560px] text-[13.5px]">
                  <thead>
                    <tr className="border-b border-[var(--border-strong)]">
                      {section.table.columns.map((c) => (
                        <th
                          key={c}
                          className="text-left py-3 px-3 font-medium text-[11px] tracking-[0.08em] uppercase text-[var(--text-muted)] whitespace-nowrap"
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row, ri) => (
                      <tr
                        key={ri}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={
                              ci === 0
                                ? "py-3 px-3 text-[var(--text-primary)] whitespace-nowrap"
                                : "py-3 px-3 tnum text-[var(--text-secondary)] whitespace-nowrap"
                            }
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          </div>
        ))}

        {/* After-content placement */}
        {footOffer && (
          <AffiliateOffer
            product={footOffer}
            variant="inline"
            context={{ path: postPath, slot: "blog_footer", postSlug: post.slug }}
          />
        )}

        {/* Methodology note with pipeline illustration */}
        <Card className="mt-16 p-7">
          <SectionLabel>How this report is made</SectionLabel>
          <div className="grid sm:grid-cols-[1fr_auto] gap-6 items-center">
            <p className="text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
              This report is generated from Realvian's area dataset, not written
              by hand. Public data is fetched, normalised against national
              distributions, scored, and published — so every figure above is
              reproducible and every claim traces to a computed value. When the
              monthly refresh changes a number, this page changes too.
            </p>
            <div className="w-full sm:w-[280px]">
              <IlloPipeline className="w-full h-auto" />
            </div>
          </div>
        </Card>

        <div className="mt-8">
          <DataNote date={post.dataDate} />
        </div>
      </article>

      {/* ══════════ AREAS REFERENCED ══════════ */}
      {referencedAreas.length > 0 && (
        <section className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14">
            <SectionLabel>Areas in this report</SectionLabel>
            <h2
              className="text-[var(--text-primary)] mb-7"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(22px, 2.6vw, 28px)",
                lineHeight: 1.1,
                letterSpacing: "-0.025em",
                fontWeight: 300,
              }}
            >
              Explore the full breakdowns
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {referencedAreas.map((a) => (
                <AreaCard key={a.slug} area={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ RELATED ══════════ */}
      {related.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14">
          <SectionLabel>Related reports</SectionLabel>
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            {related.map((r) => (
              <Link key={r.slug} href={`/blog/${r.slug}`} className="group">
                <Card hover className="h-full p-5">
                  <Badge tone="neutral" className="!text-[9.5px] mb-3">
                    {POST_KIND_LABELS[r.kind]}
                  </Badge>
                  <h3
                    className="text-[16.5px] text-[var(--text-primary)] leading-snug group-hover:text-[var(--primary)] transition-colors"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                  >
                    {r.title}
                  </h3>
                  <p className="text-[13px] text-[var(--text-muted)] mt-2.5">
                    {r.readMinutes} min read
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
