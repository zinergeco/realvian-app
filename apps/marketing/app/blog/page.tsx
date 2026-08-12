import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllPosts,
  getAllTags,
  POST_KIND_LABELS,
  type BlogPost,
} from "@/lib/blog";
import { Badge, Card, SectionLabel } from "@/components/ui";
import {
  IlloCompare,
  IlloScore,
  IlloDataFusion,
  IlloMap,
  CitySkyline,
} from "@/components/illustrations";

export const metadata: Metadata = {
  title: "UK Property Market Reports & Area Rankings",
  description:
    "Data-driven market reports, area rankings and side-by-side comparisons for UK property. Every figure computed from public sources and refreshed monthly.",
  alternates: { canonical: "/blog" },
};

/** Illustration chosen by post kind — gives each card a distinct visual */
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
        {/* Illustration header */}
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

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const tags = getAllTags();

  const featured = posts.filter((p) => p.kind === "ranking").slice(0, 2);
  const reports = posts.filter((p) => p.kind === "city-report");
  const comparisons = posts.filter((p) => p.kind === "comparison");

  return (
    <>
      {/* ══════════ HERO with skyline ══════════ */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden="true" />
        <div className="absolute inset-0 glow-emerald" aria-hidden="true" />
        {/* Skyline anchored to the bottom of the hero */}
        <div
          className="absolute bottom-0 inset-x-0 pointer-events-none opacity-50"
          style={{ height: 170, maskImage: "linear-gradient(to top, black 55%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, black 55%, transparent 100%)" }}
          aria-hidden="true"
        >
          <CitySkyline className="w-full h-full" variant="generic" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1240px] px-5 sm:px-8 pt-[104px] pb-[140px] lg:pt-[128px]">
          <SectionLabel>Market intelligence</SectionLabel>
          <h1
            className="text-[var(--text-primary)] max-w-[760px]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(38px, 5.4vw, 60px)",
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              fontWeight: 300,
            }}
          >
            Reports that rewrite
            <br />
            <em style={{ fontStyle: "italic", color: "var(--primary)", fontWeight: 300 }}>
              themselves.
            </em>
          </h1>
          <p className="mt-6 max-w-[560px] text-[16.5px] leading-[1.65] text-[var(--text-secondary)]">
            Every report here is generated from the underlying dataset, not
            written by hand. When the monthly data refresh changes a figure,
            the report changes with it — so nothing you read is stale.
          </p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 mt-8">
            {[
              { v: String(posts.length), l: "reports" },
              { v: String(reports.length), l: "cities covered" },
              { v: "Monthly", l: "refresh cadence" },
            ].map((s) => (
              <div key={s.l} className="flex items-baseline gap-2">
                <span
                  className="tnum text-[19px] font-semibold"
                  style={{ color: "var(--primary)" }}
                >
                  {s.v}
                </span>
                <span className="text-[13px] text-[var(--text-muted)]">{s.l}</span>
              </div>
            ))}
          </div>
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
            One report per city, regenerated whenever that city's underlying
            figures change.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </div>
      </section>

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

      {/* ══════════ TAGS ══════════ */}
      <section className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-12">
          <SectionLabel>Browse by topic</SectionLabel>
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((t) => (
              <Badge key={t.tag} tone="neutral">
                {t.tag} · {t.count}
              </Badge>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
