"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BlogPost } from "@/lib/blog";
import { POST_KIND_LABELS } from "@/lib/blog";
import { Badge, Card, SectionLabel } from "@/components/ui";
import { IlloCompare, IlloScore, IlloDataFusion, IlloMap } from "@/components/illustrations";

interface PostWithCities {
  post: BlogPost;
  cities: string[];
}

function PostIllustration({ post }: { post: BlogPost }) {
  const cls = "w-full h-full";
  if (post.kind === "comparison") return <IlloCompare className={cls} />;
  if (post.kind === "ranking") return <IlloScore className={cls} />;
  if (post.kind === "city-report") return <IlloMap className={cls} />;
  return <IlloDataFusion className={cls} />;
}

function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <Card hover className="h-full overflow-hidden flex flex-col">
        <div
          className="relative bg-[var(--bg-subtle)] border-b border-[var(--border)] overflow-hidden"
          style={{ height: featured ? 200 : 148 }}
        >
          <div className="absolute inset-0 grid-bg opacity-40" aria-hidden="true" />
          <div className="absolute inset-0 grid place-items-center p-5">
            <div className="w-full max-w-[210px]">
              <PostIllustration post={post} />
            </div>
          </div>
        </div>

        <div className={featured ? "p-7 flex-1 flex flex-col" : "p-5 flex-1 flex flex-col"}>
          <div className="flex items-center gap-2 mb-3">
            <Badge
              tone={
                post.kind === "ranking"
                  ? "accent"
                  : post.kind === "comparison"
                    ? "info"
                    : "primary"
              }
              className="!text-[9.5px] !py-0.5"
            >
              {POST_KIND_LABELS[post.kind]}
            </Badge>
            <span className="text-[11.5px] text-[var(--text-muted)]">
              {post.readMinutes} min read
            </span>
          </div>

          <h3
            className="text-[var(--text-primary)] leading-tight mb-2.5 group-hover:text-[var(--primary)] transition-colors"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: featured ? 24 : 19,
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            {post.title}
          </h3>

          <p
            className="text-[var(--text-secondary)] leading-relaxed flex-1"
            style={{ fontSize: featured ? 14.5 : 13.5 }}
          >
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-[var(--border)]">
            <span className="text-[11.5px] text-[var(--text-muted)]">
              Data to{" "}
              {new Date(post.dataDate).toLocaleDateString("en-GB", {
                month: "short",
                year: "numeric",
              })}
            </span>
            <span
              className="text-[13px] font-medium transition-transform duration-300 group-hover:translate-x-1"
              style={{ color: "var(--primary)" }}
            >
              Read →
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/**
 * City filtering uses each post's real, resolved cities (computed
 * server-side via lib/blog.ts's getPostCities and passed in as props),
 * not post.tags — tags alone would silently exclude every ranking
 * post (no city tag at all, despite referencing areas nationwide) and
 * any cross-city comparison, which would make "show me everything
 * about Manchester" quietly wrong rather than just incomplete.
 */
export function BlogSections({ items }: { items: PostWithCities[] }) {
  const [city, setCity] = useState<string | null>(null);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const { cities } of items) for (const c of cities) set.add(c);
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(
    () => (city ? items.filter((i) => i.cities.includes(city)) : items),
    [items, city],
  );

  const featured = filtered.filter((i) => i.post.kind === "ranking").slice(0, 2).map((i) => i.post);
  const reports = filtered.filter((i) => i.post.kind === "city-report").map((i) => i.post);
  const comparisons = filtered.filter((i) => i.post.kind === "comparison").map((i) => i.post);

  return (
    <>
      {/* ══════════ CITY FILTER ══════════ */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCity(null)}
              className="px-3 py-1.5 rounded-full text-[13px] border transition-colors"
              style={
                city === null
                  ? { background: "var(--primary)", borderColor: "var(--primary)", color: "white" }
                  : { borderColor: "var(--border)", color: "var(--text-secondary)" }
              }
            >
              All cities
            </button>
            {cityOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCity(c)}
                className="px-3 py-1.5 rounded-full text-[13px] border transition-colors"
                style={
                  city === c
                    ? { background: "var(--primary)", borderColor: "var(--primary)", color: "white" }
                    : { borderColor: "var(--border)", color: "var(--text-secondary)" }
                }
              >
                {c}
              </button>
            ))}
          </div>
          {city && (
            <p className="text-[13px] text-[var(--text-muted)] mt-3">
              {filtered.length} report{filtered.length === 1 ? "" : "s"} about {city}
            </p>
          )}
        </div>
      </section>

      {/* ══════════ FEATURED ══════════ */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14">
          <SectionLabel>Start here</SectionLabel>
          <h2
            className="text-[var(--text-primary)] mb-8"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 3vw, 32px)",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              fontWeight: 300,
            }}
          >
            National rankings
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {featured.map((p) => (
              <PostCard key={p.slug} post={p} featured />
            ))}
          </div>
        </section>
      )}

      {/* ══════════ CITY REPORTS ══════════ */}
      {reports.length > 0 && (
        <section className="border-y border-[var(--border)] bg-[var(--bg-subtle)]">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-16">
            <SectionLabel>By city</SectionLabel>
            <h2
              className="text-[var(--text-primary)] mb-3"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(24px, 3vw, 32px)",
                lineHeight: 1.1,
                letterSpacing: "-0.025em",
                fontWeight: 300,
              }}
            >
              City market reports
            </h2>
            <p className="text-[15px] text-[var(--text-secondary)] mb-8 max-w-[540px]">
              One report per city, regenerated whenever that city&rsquo;s underlying
              figures change.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ COMPARISONS ══════════ */}
      {comparisons.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-16">
          <SectionLabel>Head to head</SectionLabel>
          <h2
            className="text-[var(--text-primary)] mb-8"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 3vw, 32px)",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              fontWeight: 300,
            }}
          >
            Area comparisons
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisons.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-20 text-center">
          <p className="text-[15px] text-[var(--text-secondary)]">
            No reports found for {city}.
          </p>
        </section>
      )}
    </>
  );
}
