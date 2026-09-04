import type { Metadata } from "next";
import {
  getAllPosts,
  getAllTags,
  getPostCities,
} from "@/lib/blog";
import { getAllAreas } from "@/lib/areas";
import { Badge, SectionLabel } from "@/components/ui";
import { CitySkyline } from "@/components/illustrations";
import { BlogSections } from "@/components/blog-sections";

export const metadata: Metadata = {
  title: "UK Property Market Reports & Area Rankings",
  description:
    "Data-driven market reports, area rankings and side-by-side comparisons for UK property. Every figure computed from public sources and refreshed monthly.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const tags = getAllTags();
  const allAreas = getAllAreas();
  const reports = posts.filter((p) => p.kind === "city-report");
  const postsWithCities = posts.map((post) => ({
    post,
    cities: getPostCities(post, allAreas),
  }));

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

      <BlogSections items={postsWithCities} />

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
