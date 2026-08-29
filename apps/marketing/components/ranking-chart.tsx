"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

const COLOR = "#0EA672"; // matches --primary
const COLOR_LEADER = "#F2B134"; // matches --color-gold, the #1 spot stands out

interface ChartRow {
  label: string;
  value: number;
  displayValue: string;
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
        padding: "9px 12px",
        fontSize: 12.5,
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div style={{ fontWeight: 600 }}>{d.label}</div>
      <div style={{ color: COLOR }}>
        <strong>{d.displayValue}</strong>
      </div>
    </div>
  );
}

/**
 * Renders a market report's ranking table as a horizontal bar chart —
 * same data, same values, same order the table already shows (see
 * PostSection.chart in lib/blog.ts for why this carries pre-formatted
 * display strings from the same formatter the table cell uses, rather
 * than re-deriving them). The #1 area is highlighted in gold, matching
 * the "Exceptional" tier colour used everywhere else on the site.
 */
export function RankingChart({ items }: { items: { label: string; value: number; displayValue: string }[] }) {
  if (items.length === 0) return null;

  // Recharts' horizontal bar chart reads top-to-bottom in data order,
  // but a ranking's natural reading order is "biggest first" — reverse
  // so #1 renders at the top of the chart, not the bottom.
  const data = [...items].reverse();

  return (
    <div style={{ width: "100%", height: Math.max(280, data.length * 34) }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={150}
            tick={{ fill: "var(--text-secondary)", fontSize: 11.5 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-subtle)" }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell key={d.label} fill={i === data.length - 1 ? COLOR_LEADER : COLOR} />
            ))}
            <LabelList
              dataKey="displayValue"
              position="right"
              style={{ fill: "var(--text-primary)", fontSize: 11.5, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
