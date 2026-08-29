"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import type { PortfolioRentPoint } from "@/lib/rent-comparison";

const COLOR_ABOVE = "#0EA672"; // matches --primary — rented above area average
const COLOR_BELOW = "#F2B134"; // matches --color-gold — rented below area average, worth a rent review

function fmtGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: PortfolioRentPoint }[] }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "9px 12px",
        fontSize: 12.5,
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.nickname}</div>
      <div style={{ color: "var(--text-secondary)" }}>
        Your rent: <strong>{fmtGBP(d.currentRent)}/mo</strong>
      </div>
      <div style={{ color: "var(--text-secondary)" }}>
        Area average: <strong>{fmtGBP(d.areaAvgRent)}/mo</strong>
      </div>
      <div style={{ color: d.diffPct >= 0 ? COLOR_ABOVE : COLOR_BELOW, marginTop: 2 }}>
        <strong>
          {d.diffPct >= 0 ? "+" : ""}
          {d.diffPct}% vs. area
        </strong>
      </div>
    </div>
  );
}

/**
 * One bar per property that has both an outcode Realvian covers and a
 * self-reported current rent — properties missing either are silently
 * excluded by the caller before this ever renders (see
 * lib/rent-comparison.ts's compareRentToArea, which already returns
 * null for exactly those cases). Bars below the zero line are
 * genuinely worth a landlord's attention: rented under the area's own
 * average.
 */
export function PortfolioRentChart({ points }: { points: PortfolioRentPoint[] }) {
  if (points.length === 0) return null;

  return (
    <div style={{ width: "100%", height: Math.max(200, points.length * 40) }}>
      <ResponsiveContainer>
        <BarChart data={points} layout="vertical" margin={{ top: 4, right: 44, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tickFormatter={(v: number) => `${v}%`} tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
          <YAxis type="category" dataKey="nickname" width={110} tick={{ fill: "var(--text-secondary)", fontSize: 11.5 }} />
          <ReferenceLine x={0} stroke="var(--border-strong)" />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-subtle)" }} />
          <Bar dataKey="diffPct" radius={[3, 3, 3, 3]}>
            {points.map((p) => (
              <Cell key={p.nickname} fill={p.diffPct >= 0 ? COLOR_ABOVE : COLOR_BELOW} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
