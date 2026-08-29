"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "./ui";

/**
 * THE SIGNATURE ELEMENT.
 *
 * Rather than a stock hero image, the hero shows the product's actual
 * output: a postcode scored across live data dimensions. This is the
 * most characteristic thing in Realvian's world — the thing a buyer or
 * investor would actually look at before committing six figures.
 *
 * Cycles through three real UK postcodes so the panel feels alive.
 */

interface AreaData {
  postcode: string;
  district: string;
  city: string;
  score: number;
  avgPrice: string;
  yield: string;
  growth: string;
  metrics: { label: string; value: number; tone: "primary" | "gold" | "sapphire" }[];
}

const AREAS: AreaData[] = [
  {
    postcode: "M20",
    district: "Didsbury",
    city: "Manchester",
    score: 87,
    avgPrice: "£412,500",
    yield: "5.2%",
    growth: "+18.4%",
    metrics: [
      { label: "Schools", value: 94, tone: "primary" },
      { label: "Transport", value: 81, tone: "sapphire" },
      { label: "Safety", value: 76, tone: "primary" },
      { label: "Green space", value: 88, tone: "primary" },
      { label: "Amenities", value: 91, tone: "gold" },
    ],
  },
  {
    postcode: "LS6",
    district: "Headingley",
    city: "Leeds",
    score: 79,
    avgPrice: "£285,000",
    yield: "6.8%",
    growth: "+22.1%",
    metrics: [
      { label: "Schools", value: 82, tone: "primary" },
      { label: "Transport", value: 88, tone: "sapphire" },
      { label: "Safety", value: 68, tone: "primary" },
      { label: "Green space", value: 74, tone: "primary" },
      { label: "Amenities", value: 86, tone: "gold" },
    ],
  },
  {
    postcode: "BS8",
    district: "Clifton",
    city: "Bristol",
    score: 91,
    avgPrice: "£548,000",
    yield: "4.4%",
    growth: "+15.9%",
    metrics: [
      { label: "Schools", value: 96, tone: "primary" },
      { label: "Transport", value: 79, tone: "sapphire" },
      { label: "Safety", value: 84, tone: "primary" },
      { label: "Green space", value: 92, tone: "primary" },
      { label: "Amenities", value: 94, tone: "gold" },
    ],
  },
];

const TONE_VAR: Record<string, string> = {
  primary: "var(--primary)",
  gold: "var(--color-gold)",
  sapphire: "var(--info)",
};

export function IntelligencePanel() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Reveal on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Cycle areas — respects reduced-motion by not cycling at all
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const iv = setInterval(() => setIdx((i) => (i + 1) % AREAS.length), 5000);
    return () => clearInterval(iv);
  }, []);

  const area = AREAS[idx]!;
  const circumference = 2 * Math.PI * 42;
  const dash = (area.score / 100) * circumference;

  return (
    <div
      ref={ref}
      className="relative w-full max-w-[440px] transition-all duration-1000"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transitionTimingFunction: "var(--ease-out-expo)",
      }}
    >
      {/* Ambient glow behind the panel */}
      <div
        className="absolute -inset-8 -z-10 rounded-full blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(circle, var(--primary-subtle) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div
        className="bg-[var(--surface)] border border-[var(--border)]
                   rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)]
                   overflow-hidden backdrop-blur-xl"
      >
        {/* ── Panel header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2 h-2 rounded-full animate-pulse-dot"
              style={{ background: "var(--primary)" }}
              aria-hidden="true"
            />
            <span className="text-[11.5px] font-medium tracking-[0.12em] uppercase text-[var(--text-muted)]">
              Live area intelligence
            </span>
          </div>
          <span className="tnum text-[11.5px] text-[var(--text-muted)]">
            {String(idx + 1).padStart(2, "0")}/{String(AREAS.length).padStart(2, "0")}
          </span>
        </div>

        {/* ── Score + location ── */}
        <div className="px-6 pt-6 pb-5 flex items-center gap-5">
          {/* Score ring */}
          <div className="relative shrink-0">
            <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="var(--bg-inset)"
                strokeWidth="7"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                transform="rotate(-90 50 50)"
                style={{
                  transition: "stroke-dasharray 1.1s var(--ease-out-expo)",
                }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div
                  className="tnum leading-none font-semibold text-[var(--text-primary)]"
                  style={{ fontSize: 30 }}
                >
                  {area.score}
                </div>
                <div className="text-[9.5px] tracking-[0.1em] uppercase text-[var(--text-muted)] mt-1">
                  Score
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className="tnum text-[15px] font-semibold"
                style={{ color: "var(--primary)" }}
              >
                {area.postcode}
              </span>
              <Badge tone="neutral" className="!text-[10px] !py-0.5">
                {area.city}
              </Badge>
            </div>
            <h3
              className="text-[26px] leading-tight font-normal text-[var(--text-primary)] truncate"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              {area.district}
            </h3>
            <p className="text-[12.5px] text-[var(--text-muted)] mt-1">
              Realvian Score · 6 dimensions
            </p>
          </div>
        </div>

        {/* ── Key figures ── */}
        <div className="grid grid-cols-3 border-y border-[var(--border)] divide-x divide-[var(--border)]">
          {[
            { k: "Avg price", v: area.avgPrice },
            { k: "Gross yield", v: area.yield },
            { k: "5-yr growth", v: area.growth, accent: true },
          ].map((f) => (
            <div key={f.k} className="px-4 py-3.5">
              <div className="text-[10px] tracking-[0.1em] uppercase text-[var(--text-muted)] mb-1.5">
                {f.k}
              </div>
              <div
                className="tnum text-[15px] font-semibold"
                style={{
                  color: f.accent ? "var(--primary)" : "var(--text-primary)",
                }}
              >
                {f.v}
              </div>
            </div>
          ))}
        </div>

        {/* ── Metric bars ── */}
        <div className="px-6 py-5 space-y-3">
          {area.metrics.map((m, i) => (
            <div key={m.label} className="flex items-center gap-3">
              <span className="text-[12.5px] text-[var(--text-secondary)] w-[86px] shrink-0">
                {m.label}
              </span>
              <div className="flex-1 h-[6px] rounded-full bg-[var(--bg-inset)] overflow-hidden">
                <div
                  className="h-full rounded-full origin-left"
                  style={{
                    width: `${m.value}%`,
                    background: TONE_VAR[m.tone],
                    transition: `width 0.9s var(--ease-out-expo) ${i * 70}ms`,
                  }}
                />
              </div>
              <span className="tnum text-[12px] text-[var(--text-muted)] w-7 text-right shrink-0">
                {m.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3.5 bg-[var(--bg-subtle)] border-t border-[var(--border)] flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)]">
            Fused from 14 public sources
          </span>
          <span className="tnum text-[11px] text-[var(--text-muted)]">
            Updated today
          </span>
        </div>
      </div>
    </div>
  );
}
