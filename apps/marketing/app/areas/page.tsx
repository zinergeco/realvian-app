import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllAreas,
  getAllCities,
  getRankedAreas,
  fmtYield,
  fmtPct,
} from "@/lib/areas";
import { AreaCard, DataNote } from "@/components/area-viz";
import { Badge, Card, SectionLabel } from "@/components/ui";

export const metadata: Metadata = {
  title: "UK Area Guides — Property Data for Every Postcode",
  description:
    "Browse Realvian Scores, average prices, rental yields and five-year growth for UK areas. Schools, crime, transport and amenities analysed across 40 areas in 13 cities.",
  alternates: { canonical: "/areas" },
};

const RANKINGS = [
  {
    title: "Highest liveability",
    field: "realvianScore" as const,
    suffix: (v: number) => `${v}/100`,
    key: "realvianScore" as const,
  },
  {
    title: "Highest yield",
    field: "grossYield" as const,
    suffix: (v: number) => fmtYield(v),
    key: "grossYield" as const,
  },
  {
    title: "Fastest growth",
    field: "fiveYearGrowth" as const,
    suffix: (v: number) => fmtPct(v),
    key: "fiveYearGrowth" as const,
  },
];

export default function AreasHubPage() {
  const areas = getAllAreas();
  const cities = getAllCities();

  return (
    <>
      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 grid-bg opacity-60" aria-hidden="true" />
        <div className="absolute inset-0 glow-emerald" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 pt-[104px] pb-14 lg:pt-[128px]">
          <SectionLabel>Area intelligence</SectionLabel>
          <h1
            className="text-[var(--text-primary)] max-w-[720px]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(38px, 5.5vw, 62px)",
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              fontWeight: 300,
            }}
          >
            Every area,
            <br />
            <em style={{ fontStyle: "italic", color: "var(--primary)", fontWeight: 300 }}>
              scored the same way.
            </em>
          </h1>
          <p className="mt-6 max-w-[560px] text-[16.5px] leading-[1.65] text-[var(--text-secondary)]">
            {areas.length} areas across {cities.length} UK cities, each scored on six
            dimensions and normalised nationally — so a score in Glasgow means the
            same thing as a score in Bristol.
          </p>

          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 mt-8">
            {[
              { v: String(areas.length), l: "areas scored" },
              { v: String(cities.length), l: "cities covered" },
              { v: "6", l: "dimensions each" },
            ].map((s) => (
              <div key={s.l} className="flex items-baseline gap-2">
                <span className="tnum text-[19px] font-semibold" style={{ color: "var(--primary)" }}>
                  {s.v}
                </span>
                <span className="text-[13px] text-[var(--text-muted)]">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ RANKINGS ══════════ */}
      <section className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14">
          <SectionLabel>Leaderboards</SectionLabel>
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
            Top five by measure
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            {RANKINGS.map((r) => {
              const top = getRankedAreas(r.field, "desc", 5);
              return (
                <Card key={r.title} className="p-6">
                  <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-5">
                    {r.title}
                  </h3>
                  <ol className="space-y-3.5">
                    {top.map((a, i) => (
                      <li key={a.slug}>
                        <Link
                          href={`/areas/${a.slug}`}
                          className="flex items-center gap-3 group"
                        >
                          <span className="tnum text-[12px] text-[var(--text-muted)] w-4 shrink-0">
                            {i + 1}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[14px] text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                              {a.district}
                            </span>
                            <span className="block text-[11.5px] text-[var(--text-muted)]">
                              {a.city}
                            </span>
                          </span>
                          <span
                            className="tnum text-[13.5px] font-semibold shrink-0"
                            style={{ color: "var(--primary)" }}
                          >
                            {r.suffix(a[r.key])}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ BY CITY ══════════ */}
      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-16">
        <SectionLabel>Browse by city</SectionLabel>
        <h2
          className="text-[var(--text-primary)] mb-4"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px, 3vw, 34px)",
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            fontWeight: 300,
          }}
        >
          All {areas.length} areas
        </h2>
        <div className="flex flex-wrap gap-2 mb-10">
          {cities.map((c) => (
            <a key={c.city} href={`#${c.city.toLowerCase().replace(/\s+/g, "-")}`}>
              <Badge tone="neutral" className="hover:!border-[var(--primary-border)] transition-colors">
                {c.city} · {c.count}
              </Badge>
            </a>
          ))}
        </div>

        <div className="space-y-14">
          {cities.map((c) => {
            const cityAreas = areas
              .filter((a) => a.city === c.city)
              .sort((a, b) => b.realvianScore - a.realvianScore);
            return (
              <div key={c.city} id={c.city.toLowerCase().replace(/\s+/g, "-")}>
                <div className="flex items-baseline justify-between gap-4 mb-5 pb-3 border-b border-[var(--border)]">
                  <h3
                    className="text-[22px] text-[var(--text-primary)]"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 500,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {c.city}
                  </h3>
                  <span className="text-[12.5px] text-[var(--text-muted)]">
                    {c.region} · {c.count} {c.count === 1 ? "area" : "areas"}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cityAreas.map((a) => (
                    <AreaCard key={a.slug} area={a} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-14 pt-8 border-t border-[var(--border)]">
          <DataNote date="2026-08-01" />
        </div>
      </section>
    </>
  );
}
