"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AreaDimension } from "@/lib/areas";

const COLOR_A = "var(--primary)"; // "this area", theme-aware
const COLOR_B = "var(--info)"; // deliberately a different hue, not a shade of green, theme-aware

interface RadarPoint {
  dimension: string;
  areaA: number;
  areaB: number;
  detailA: string;
  detailB: string;
}

/**
 * Matches dimensions by `key`, not array index — the compare page's
 * existing table pairs them up by index (a.dimensions[i] with
 * b.dimensions[i]), which works today because every area happens to
 * use the same six dimensions in the same order, but key-matching is
 * the more defensive choice for a brand-new component rather than
 * inheriting an assumption I didn't have to.
 */
function buildRadarData(dimensionsA: AreaDimension[], dimensionsB: AreaDimension[]): RadarPoint[] {
  const bByKey = new Map(dimensionsB.map((d) => [d.key, d]));
  return dimensionsA
    .map((dA) => {
      const dB = bByKey.get(dA.key);
      if (!dB) return null;
      return {
        dimension: dA.label,
        areaA: dA.value,
        areaB: dB.value,
        detailA: dA.detail,
        detailB: dB.detail,
      };
    })
    .filter((d): d is RadarPoint => d !== null);
}

function CustomTooltip({
  active,
  payload,
  nameA,
  nameB,
}: {
  active?: boolean;
  payload?: { payload: RadarPoint }[];
  nameA: string;
  nameB: string;
}) {
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
        maxWidth: 220,
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{d.dimension}</div>
      <div style={{ color: COLOR_A, marginBottom: 2 }}>
        {nameA}: <strong>{d.areaA}</strong>
      </div>
      <div style={{ color: COLOR_B }}>
        {nameB}: <strong>{d.areaB}</strong>
      </div>
    </div>
  );
}

export function DimensionRadar({
  dimensionsA,
  dimensionsB,
  nameA,
  nameB,
}: {
  dimensionsA: AreaDimension[];
  dimensionsB: AreaDimension[];
  nameA: string;
  nameB: string;
}) {
  const data = buildRadarData(dimensionsA, dimensionsB);

  if (data.length === 0) {
    // Genuinely defensive, not decorative — if the two areas somehow
    // share no dimension keys at all (shouldn't happen given the
    // shared national scoring framework, but "shouldn't happen" isn't
    // the same as "verified impossible"), show nothing rather than an
    // empty, confusing chart frame.
    return null;
  }

  return (
    <div style={{ width: "100%", height: 340 }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "var(--text-secondary)", fontSize: 12.5 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name={nameA} dataKey="areaA" stroke={COLOR_A} fill={COLOR_A} fillOpacity={0.22} strokeWidth={2} />
          <Radar name={nameB} dataKey="areaB" stroke={COLOR_B} fill={COLOR_B} fillOpacity={0.16} strokeWidth={2} />
          <Legend wrapperStyle={{ fontSize: 12.5 }} />
          <Tooltip content={<CustomTooltip nameA={nameA} nameB={nameB} />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
