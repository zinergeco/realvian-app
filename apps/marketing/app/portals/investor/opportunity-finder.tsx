"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Area } from "@/lib/areas";
import { Card, cx } from "@/components/ui";
import { ScoreRing } from "@/components/area-viz";

type SortKey = "investmentScore" | "grossYield" | "fiveYearGrowth" | "avgPrice";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "investmentScore", label: "Investment score" },
  { key: "grossYield", label: "Gross yield" },
  { key: "fiveYearGrowth", label: "5-year growth" },
  { key: "avgPrice", label: "Lowest price" },
];

function fmtGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

export function OpportunityFinder({ areas }: { areas: Area[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("investmentScore");
  const [minYield, setMinYield] = useState(0);
  const [maxPrice, setMaxPrice] = useState<number>(0); // 0 = no cap
  const [city, setCity] = useState("");

  const cities = useMemo(
    () => Array.from(new Set(areas.map((a) => a.city))).sort(),
    [areas],
  );

  const filtered = useMemo(() => {
    let list = areas.filter((a) => a.grossYield >= minYield);
    if (maxPrice > 0) list = list.filter((a) => a.avgPrice <= maxPrice);
    if (city) list = list.filter((a) => a.city === city);

    return [...list].sort((a, b) =>
      sortKey === "avgPrice" ? a.avgPrice - b.avgPrice : b[sortKey] - a[sortKey],
    );
  }, [areas, sortKey, minYield, maxPrice, city]);

  return (
    <div>
      {/* ── Filters ── */}
      <Card className="p-5 mb-6">
        <div className="grid sm:grid-cols-4 gap-4">
          <label className="block">
            <span className="block text-[12px] font-medium text-[var(--text-primary)] mb-1.5">Sort by</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="w-full py-2 px-3 bg-[var(--bg-subtle)] border border-[var(--border-strong)]
                         rounded-[var(--radius-sm)] text-[13.5px] text-[var(--text-primary)]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[12px] font-medium text-[var(--text-primary)] mb-1.5">Min. gross yield</span>
            <div className="relative">
              <input
                type="number"
                value={minYield || ""}
                onChange={(e) => setMinYield(Number(e.target.value) || 0)}
                placeholder="0"
                step={0.5}
                className="w-full py-2 pl-3 pr-8 bg-[var(--bg-subtle)] border border-[var(--border-strong)]
                           rounded-[var(--radius-sm)] text-[13.5px] text-[var(--text-primary)]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12.5px] text-[var(--text-muted)]">%</span>
            </div>
          </label>

          <label className="block">
            <span className="block text-[12px] font-medium text-[var(--text-primary)] mb-1.5">Max. avg price</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12.5px] text-[var(--text-muted)]">£</span>
              <input
                type="number"
                value={maxPrice || ""}
                onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
                placeholder="No limit"
                step={25000}
                className="w-full py-2 pl-6 pr-3 bg-[var(--bg-subtle)] border border-[var(--border-strong)]
                           rounded-[var(--radius-sm)] text-[13.5px] text-[var(--text-primary)]"
              />
            </div>
          </label>

          <label className="block">
            <span className="block text-[12px] font-medium text-[var(--text-primary)] mb-1.5">City</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full py-2 px-3 bg-[var(--bg-subtle)] border border-[var(--border-strong)]
                         rounded-[var(--radius-sm)] text-[13.5px] text-[var(--text-primary)]"
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <p className="text-[13px] text-[var(--text-muted)] mb-4">
        {filtered.length} area{filtered.length === 1 ? "" : "s"} match{filtered.length === 1 ? "es" : ""}
      </p>

      {/* ── Results ── */}
      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-[14px] text-[var(--text-secondary)]">
              Nothing matches those filters. Try a lower minimum yield or a higher price cap.
            </p>
          </Card>
        )}
        {filtered.map((area, i) => (
          <Link key={area.slug} href={`/areas/${area.slug}`}>
            <Card hover className="p-4 flex items-center gap-4">
              <span
                className="w-6 text-[13px] text-[var(--text-muted)] tnum shrink-0 text-center"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <ScoreRing score={area.investmentScore} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                    {area.district}
                  </h3>
                  <span className="text-[12.5px] text-[var(--text-muted)]">
                    {area.city} · {area.outcode}
                  </span>
                </div>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                  {fmtGBP(area.avgPrice)} avg
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-5 shrink-0">
                <div className="text-right">
                  <div className="tnum text-[14px] font-semibold" style={{ color: "var(--primary)" }}>
                    {area.grossYield.toFixed(1)}%
                  </div>
                  <div className="text-[10.5px] text-[var(--text-muted)]">yield</div>
                </div>
                <div className="text-right">
                  <div
                    className={cx(
                      "tnum text-[14px] font-semibold",
                      area.fiveYearGrowth >= 0 ? "" : "text-[var(--danger)]",
                    )}
                    style={area.fiveYearGrowth >= 0 ? { color: "var(--primary)" } : undefined}
                  >
                    {area.fiveYearGrowth >= 0 ? "+" : ""}{area.fiveYearGrowth.toFixed(1)}%
                  </div>
                  <div className="text-[10.5px] text-[var(--text-muted)]">5yr growth</div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
