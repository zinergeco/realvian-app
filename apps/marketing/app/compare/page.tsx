import type { Metadata } from "next";
import Link from "next/link";
import { getAllAreas, getAreaBySlug } from "@/lib/areas";
import { getCurrentUser } from "@/lib/public-auth";
import { ComparisonView } from "@/components/comparison-view";
import { SectionLabel } from "@/components/ui";

export const metadata: Metadata = {
  title: "Compare UK Areas Side by Side",
  description:
    "Compare any two UK areas across price, yield, growth, schools, crime, transport and amenities. Free, instant, and shareable.",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const areas = getAllAreas();
  const user = await getCurrentUser();

  // Shareable URLs: /compare?a=didsbury-m20&b=clifton-bs8
  const areaA = a ? getAreaBySlug(a) : undefined;
  const areaB = b ? getAreaBySlug(b) : undefined;

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 grid-bg opacity-60" aria-hidden="true" />
        <div className="absolute inset-0 glow-emerald" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 pt-[104px] pb-12 lg:pt-[128px]">
          <SectionLabel>Comparison engine</SectionLabel>
          <h1
            className="text-[var(--text-primary)] max-w-[760px]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(36px, 5.2vw, 58px)",
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              fontWeight: 300,
            }}
          >
            Two areas.
            <br />
            <em style={{ fontStyle: "italic", color: "var(--primary)", fontWeight: 300 }}>
              One honest answer.
            </em>
          </h1>
          <p className="mt-6 max-w-[560px] text-[16.5px] leading-[1.65] text-[var(--text-secondary)]">
            Pick any two areas and see them measured against each other on the
            same six dimensions plus the market figures that matter. Free, no
            account needed — and the URL is shareable.
          </p>
        </div>
      </section>

      <ComparisonView areas={areas} initialA={areaA} initialB={areaB} isLoggedIn={Boolean(user)} />

      {/* Internal linking for SEO — pre-built comparison pairs */}
      <section className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14">
          <SectionLabel>Popular comparisons</SectionLabel>
          <h2
            className="text-[var(--text-primary)] mb-7"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 2.8vw, 30px)",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              fontWeight: 300,
            }}
          >
            Comparisons people run most
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              ["didsbury-m20", "chorlton-m21"],
              ["clifton-bs8", "richmond-tw9"],
              ["headingley-ls6", "hyde-park-ls2"],
              ["ancoats-m4", "digbeth-b5"],
              ["leith-eh6", "west-end-g3"],
              ["walthamstow-e17", "peckham-se15"],
            ].map(([x, y]) => {
              const ax = getAreaBySlug(x!);
              const ay = getAreaBySlug(y!);
              if (!ax || !ay) return null;
              return (
                <Link
                  key={`${x}-${y}`}
                  href={`/compare?a=${x}&b=${y}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5
                             bg-[var(--surface)] border border-[var(--border)]
                             rounded-[var(--radius-md)] transition-all
                             hover:border-[var(--primary-border)] hover:-translate-y-0.5"
                >
                  <span className="text-[14px] text-[var(--text-primary)] min-w-0 truncate">
                    {ax.district} <span className="text-[var(--text-muted)]">vs</span>{" "}
                    {ay.district}
                  </span>
                  <span
                    className="text-[13px] shrink-0"
                    style={{ color: "var(--primary)" }}
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
