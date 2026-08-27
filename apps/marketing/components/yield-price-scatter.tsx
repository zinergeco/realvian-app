"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Area } from "@/lib/areas";
import { scoreVerdict } from "@/lib/areas";

// Matches components/ui.tsx's Badge tones and the area map's marker
// colours exactly — the same colour has meant the same thing on every
// visualisation across the whole site since the map shipped, and this
// keeps that consistent rather than inventing a fourth colour scheme.
const TONE_COLORS: Record<string, string> = {
  accent: "#F2B134",
  primary: "#0EA672",
  neutral: "#8A93A3",
};

function fmtGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: Area }[] }) {
  if (!active || !payload?.[0]) return null;
  const a = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "10px 12px",
        fontSize: 12.5,
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        {a.district}, {a.city}
      </div>
      <div style={{ color: "var(--text-secondary)" }}>Price: <strong>{fmtGBP(a.avgPrice)}</strong></div>
      <div style={{ color: "var(--text-secondary)" }}>Yield: <strong>{a.grossYield.toFixed(1)}%</strong></div>
      <div style={{ color: "var(--text-secondary)" }}>Score: <strong>{a.realvianScore}/100</strong></div>
    </div>
  );
}

/**
 * The classic yield-vs-price investment scatter — top-left of the
 * chart is the sweet spot (high yield, low price), while a list alone
 * makes you scan every row to build that same picture in your head.
 * Reads whatever `areas` array the parent's filters have already
 * narrowed down to, so this reacts to the same min-yield/max-price/
 * city filters as the ranked list below it rather than being a
 * separate, static chart that can drift out of sync.
 */
export function YieldPriceScatter({ areas }: { areas: Area[] }) {
  if (areas.length === 0) return null;

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey="avgPrice"
            name="Price"
            tickFormatter={(v: number) => `£${Math.round(v / 1000)}k`}
            tick={{ fill: "var(--text-muted)", fontSize: 11.5 }}
            label={{ value: "Average price", position: "insideBottom", offset: -4, fontSize: 11.5, fill: "var(--text-muted)" }}
          />
          <YAxis
            type="number"
            dataKey="grossYield"
            name="Yield"
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fill: "var(--text-muted)", fontSize: 11.5 }}
            width={40}
            label={{ value: "Gross yield", angle: -90, position: "insideLeft", fontSize: 11.5, fill: "var(--text-muted)" }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={areas} fillOpacity={0.85}>
            {areas.map((a) => (
              <Cell key={a.slug} fill={TONE_COLORS[scoreVerdict(a.realvianScore).tone] ?? TONE_COLORS.neutral} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
