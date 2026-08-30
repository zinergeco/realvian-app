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

const COLOR_AREA = "var(--primary)";
const COLOR_AVERAGE = "var(--text-muted)"; // deliberately understated, this is the baseline, not the subject

interface RadarPoint {
  dimension: string;
  areaValue: number;
  peerValue: number;
}

function buildRadarData(
  dimensions: AreaDimension[],
  peerDimensions: { key: string; value: number }[],
): RadarPoint[] {
  const peerByKey = new Map(peerDimensions.map((d) => [d.key, d.value]));
  return dimensions
    .map((d) => {
      const peerValue = peerByKey.get(d.key);
      if (peerValue === undefined) return null;
      return { dimension: d.label, areaValue: d.value, peerValue };
    })
    .filter((d): d is RadarPoint => d !== null);
}

function CustomTooltip({
  active,
  payload,
  areaName,
  peerLabel,
}: {
  active?: boolean;
  payload?: { payload: RadarPoint }[];
  areaName: string;
  peerLabel: string;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const diff = d.areaValue - d.peerValue;
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
      <div style={{ color: COLOR_AREA, marginBottom: 2 }}>
        {areaName}: <strong>{d.areaValue}</strong>
      </div>
      <div style={{ color: COLOR_AVERAGE, marginBottom: 4 }}>
        {peerLabel}: <strong>{d.peerValue}</strong>
      </div>
      <div style={{ color: diff >= 0 ? COLOR_AREA : "var(--highlight)", fontSize: 11.5 }}>
        {diff >= 0 ? "+" : ""}
        {diff} vs. typical
      </div>
    </div>
  );
}

export function AreaPeerRadar({
  dimensions,
  peerDimensions,
  areaName,
  peerLabel,
}: {
  dimensions: AreaDimension[];
  peerDimensions: { key: string; value: number }[];
  areaName: string;
  peerLabel: string;
}) {
  const data = buildRadarData(dimensions, peerDimensions);
  if (data.length === 0) return null;

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: "var(--text-secondary)", fontSize: 12.5 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name={peerLabel}
            dataKey="peerValue"
            stroke={COLOR_AVERAGE}
            fill={COLOR_AVERAGE}
            fillOpacity={0.12}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <Radar
            name={areaName}
            dataKey="areaValue"
            stroke={COLOR_AREA}
            fill={COLOR_AREA}
            fillOpacity={0.22}
            strokeWidth={2}
          />
          <Legend wrapperStyle={{ fontSize: 12.5 }} />
          <Tooltip content={<CustomTooltip areaName={areaName} peerLabel={peerLabel} />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
