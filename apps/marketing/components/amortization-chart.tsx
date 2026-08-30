"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AmortizationYear } from "@/lib/calculators";

const COLOR_BALANCE = "var(--primary)";
const COLOR_INTEREST = "var(--color-gold)"; // this one happens to be identical in both themes, but kept consistent with the rest for the same reason

function fmtGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: AmortizationYear }[]; label?: number }) {
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
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Year {label}</div>
      <div style={{ color: COLOR_BALANCE, marginBottom: 2 }}>
        Remaining balance: <strong>{fmtGBP(d.remainingBalance)}</strong>
      </div>
      <div style={{ color: COLOR_INTEREST }}>
        Interest paid so far: <strong>{fmtGBP(d.cumulativeInterest)}</strong>
      </div>
    </div>
  );
}

export function AmortizationChart({ schedule }: { schedule: AmortizationYear[] }) {
  if (schedule.length === 0) return null;

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <AreaChart data={schedule} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="year"
            tick={{ fill: "var(--text-muted)", fontSize: 11.5 }}
            label={{ value: "Year", position: "insideBottom", offset: -3, fontSize: 11.5, fill: "var(--text-muted)" }}
          />
          <YAxis
            tickFormatter={(v: number) => `£${Math.round(v / 1000)}k`}
            tick={{ fill: "var(--text-muted)", fontSize: 11.5 }}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12.5 }} />
          <Area
            type="monotone"
            dataKey="remainingBalance"
            name="Remaining balance"
            stroke={COLOR_BALANCE}
            fill={COLOR_BALANCE}
            fillOpacity={0.18}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="cumulativeInterest"
            name="Interest paid so far"
            stroke={COLOR_INTEREST}
            fill={COLOR_INTEREST}
            fillOpacity={0.18}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
