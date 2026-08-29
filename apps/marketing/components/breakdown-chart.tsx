"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

export type BreakdownKind = "income" | "expense" | "result";

export interface BreakdownItem {
  label: string;
  value: number;
  kind: BreakdownKind;
}

// income: money coming in. expense: money going out (rendered as a
// negative bar, even though the value passed in is positive — the
// chart's whole point is to make "this reduces your return" visually
// obvious rather than another same-direction green bar). result: the
// final net figure, visually distinguished so it doesn't read as just
// another line item.
const KIND_COLORS: Record<BreakdownKind, string> = {
  income: "#0EA672",
  expense: "#E8735F",
  result: "#076B49",
};

function fmtGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

interface ChartRow {
  label: string;
  displayValue: number;
  kind: BreakdownKind;
  originalValue: number;
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
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.label}</div>
      <div style={{ color: KIND_COLORS[d.kind] }}>
        {d.kind === "expense" ? "\u2212" : ""}
        <strong>{fmtGBP(d.originalValue)}</strong>
      </div>
    </div>
  );
}

/**
 * Expense items are passed in as positive numbers (matching how
 * they're already displayed everywhere else on the site — "Annual
 * running costs: £2,500", never "-£2,500") but rendered here as
 * negative bars, since the whole point of this chart is showing which
 * items reduce the final result rather than just listing numbers.
 */
export function BreakdownChart({ items }: { items: BreakdownItem[] }) {
  if (items.length === 0) return null;

  const data: ChartRow[] = items.map((item) => ({
    label: item.label,
    displayValue: item.kind === "expense" ? -Math.abs(item.value) : item.value,
    kind: item.kind,
    originalValue: item.value,
  }));

  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
          <YAxis
            tickFormatter={(v: number) => `£${Math.round(Math.abs(v) / 1000)}k`}
            tick={{ fill: "var(--text-muted)", fontSize: 11.5 }}
            width={46}
          />
          <ReferenceLine y={0} stroke="var(--border)" />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-subtle)" }} />
          <Bar dataKey="displayValue" radius={[4, 4, 4, 4]}>
            {data.map((d) => (
              <Cell key={d.label} fill={KIND_COLORS[d.kind]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
