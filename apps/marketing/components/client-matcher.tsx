"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Area } from "@/lib/areas";
import { fmtPrice } from "@/lib/areas";
import { Card, Badge, cx } from "@/components/ui";
import { ScoreRing } from "@/components/area-viz";

const DIMENSION_OPTIONS: { key: string; label: string }[] = [
  { key: "schools", label: "Schools" },
  { key: "transport", label: "Transport" },
  { key: "safety", label: "Safety" },
  { key: "green", label: "Green space" },
  { key: "amenities", label: "Amenities" },
  { key: "affordability", label: "Affordability" },
];

interface MatchedArea {
  area: Area;
  matchScore: number;
}

/**
 * Ranks areas by the average of the client's selected priority
 * dimensions, not by realvianScore — a client who only cares about
 * schools and safety shouldn't be shown an area that's great on
 * amenities but middling on the two things they actually asked for.
 * Falls back to the overall Realvian Score when no dimension is
 * selected, so the tool still returns something reasonable before an
 * agent has picked any priorities.
 */
function computeMatches(areas: Area[], selectedDims: Set<string>, maxBudget: number, city: string): MatchedArea[] {
  let list = areas;
  if (maxBudget > 0) list = list.filter((a) => a.avgPrice <= maxBudget);
  if (city) list = list.filter((a) => a.city === city);

  const matched: MatchedArea[] = list.map((area) => {
    if (selectedDims.size === 0) {
      return { area, matchScore: area.realvianScore };
    }
    const relevant = area.dimensions.filter((d) => selectedDims.has(d.key));
    const avg = relevant.reduce((sum, d) => sum + d.value, 0) / relevant.length;
    return { area, matchScore: Math.round(avg) };
  });

  return matched.sort((a, b) => b.matchScore - a.matchScore);
}

export function ClientMatcher({ areas }: { areas: Area[] }) {
  const [selectedDims, setSelectedDims] = useState<Set<string>>(new Set());
  const [maxBudget, setMaxBudget] = useState(0); // 0 = no cap
  const [city, setCity] = useState("");

  const cities = useMemo(() => [...new Set(areas.map((a) => a.city))].sort(), [areas]);

  const matches = useMemo(
    () => computeMatches(areas, selectedDims, maxBudget, city),
    [areas, selectedDims, maxBudget, city],
  );

  function toggleDim(key: string) {
    setSelectedDims((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div>
      <Card className="p-5 mb-6">
        <p className="text-[12.5px] font-medium text-[var(--text-primary)] mb-2.5">
          What does this client actually care about?
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {DIMENSION_OPTIONS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => toggleDim(d.key)}
              className="px-3 py-1.5 rounded-full text-[13px] border transition-colors"
              style={
                selectedDims.has(d.key)
                  ? { background: "var(--primary)", borderColor: "var(--primary)", color: "white" }
                  : { borderColor: "var(--border)", color: "var(--text-secondary)" }
              }
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-[12px] font-medium text-[var(--text-primary)] mb-1.5">
              Max budget
            </span>
            <select
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[13.5px] text-[var(--text-primary)]"
            >
              <option value={0}>No limit</option>
              <option value={250000}>Up to £250,000</option>
              <option value={350000}>Up to £350,000</option>
              <option value={450000}>Up to £450,000</option>
              <option value={600000}>Up to £600,000</option>
              <option value={800000}>Up to £800,000</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-[12px] font-medium text-[var(--text-primary)] mb-1.5">
              City
            </span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[13.5px] text-[var(--text-primary)]"
            >
              <option value="">Any city</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {matches.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-[13.5px] text-[var(--text-secondary)]">
            No areas match that budget and city combination. Try raising the budget or clearing the city filter.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2.5">
          {matches.slice(0, 8).map(({ area, matchScore }, i) => (
            <li key={area.slug}>
              <Link
                href={`/areas/${area.slug}`}
                className={cx(
                  "flex items-center gap-4 p-3.5 rounded-[var(--radius-md)] border transition-colors",
                  "border-[var(--border)] bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]",
                )}
              >
                <span className="text-[13px] tnum text-[var(--text-muted)] w-5 shrink-0">
                  {i + 1}
                </span>
                <ScoreRing score={matchScore} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14.5px] font-medium text-[var(--text-primary)]">
                      {area.district}
                    </span>
                    {selectedDims.size > 0 && (
                      <Badge tone="neutral" className="!text-[10px]">Match {matchScore}</Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                    {area.city} · {area.outcode} — {fmtPrice(area.avgPrice)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
