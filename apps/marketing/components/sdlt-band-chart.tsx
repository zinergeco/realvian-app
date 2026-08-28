"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { SdltBandResult } from "@/lib/calculators";

// A sequential palette from the site's existing primary green through
// to gold — the intent is "cooler/lower rate" to "warmer/higher rate"
// reading left to right, not an arbitrary rainbow.
const BAND_COLORS = ["#8A93A3", "#0EA672", "#0B8A5E", "#D99A1F", "#F2B134"];

function fmtGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

function bandLabel(band: SdltBandResult): string {
  const from = band.from >= 1000 ? `£${Math.round(band.from / 1000)}k` : `£${band.from}`;
  const to = band.to === null ? "+" : band.to >= 1000 ? `£${Math.round(band.to / 1000)}k` : `£${band.to}`;
  return `${from}\u2013${to}`;
}

interface ChartRow {
  label: string;
  rateLabel: string;
  tax: number;
  taxableAmount: number;
  colorIndex: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartRow }[] }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
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
        {d.label} band ({d.rateLabel})
      </div>
      <div style={{ color: "var(--text-secondary)" }}>
        Taxable in this band: <strong>{fmtGBP(d.taxableAmount)}</strong>
      </div>
      <div style={{ color: "var(--text-secondary)" }}>
        Tax charged: <strong>{fmtGBP(d.tax)}</strong>
      </div>
    </div>
  );
}

/**
 * One bar per SDLT band the purchase price actually reaches — bands
 * below the price (fully taxed at that band's rate) and the final
 * partial band are both included, since calculateSdlt() already only
 * returns bands the price reaches (see lib/calculators.ts — the loop
 * breaks once price <= lower, so there's nothing to filter here).
 */
export function SdltBandChart({ bands }: { bands: SdltBandResult[] }) {
  const data: ChartRow[] = bands.map((band, i) => ({
    label: bandLabel(band),
    rateLabel: `${(band.rate * 100).toFixed(band.rate * 100 % 1 === 0 ? 0 : 1)}%`,
    tax: band.tax,
    taxableAmount: band.taxableAmount,
    colorIndex: i,
  }));

  if (data.length === 0) return null;

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v: number) => `£${Math.round(v / 1000)}k`}
            tick={{ fill: "var(--text-muted)", fontSize: 11.5 }}
            width={46}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-subtle)" }} />
          <Bar dataKey="tax" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.label} fill={BAND_COLORS[d.colorIndex % BAND_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
