"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Area } from "@/lib/areas";
import { scoreVerdict } from "@/lib/areas";

// Matches components/ui.tsx's exact Badge tone colors — accent (gold),
// primary (emerald), neutral (muted gray) — so a marker's colour means
// the same thing here as it does everywhere else on the site, not a
// separate colour language invented just for this map.
// Theme-aware, not hardcoded — resolves against the page's real
// light/dark CSS variables at render time. Previously hardcoded to
// the light-mode hex values only, which meant markers stayed a
// visibly duller green in dark mode while every button and badge
// around them correctly switched to the brighter dark-mode primary
// (#0EA672 vs #22D98A) — confirmed as a real, visible mismatch before
// fixing, not just a theoretical one.
const TONE_COLORS: Record<string, string> = {
  accent: "var(--color-gold)",
  primary: "var(--primary)",
  neutral: "var(--text-muted)",
};

function fmtGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

export function AreaMap({ areas }: { areas: Area[] }) {
  // Centres on the real mean position of the covered areas rather
  // than a hard-coded "centre of the UK" guess — shifts correctly if
  // the dataset's geographic spread ever changes.
  const center = useMemo((): [number, number] => {
    const lat = areas.reduce((sum, a) => sum + a.lat, 0) / areas.length;
    const lng = areas.reduce((sum, a) => sum + a.lng, 0) / areas.length;
    return [lat, lng];
  }, [areas]);

  return (
    <div className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] shadow-[var(--shadow-sm)]">
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: "560px", width: "100%", background: "#f7f8fa" }}
      >
        {/* CARTO Voyager — free, keyless, explicitly licensed for this
            kind of production use (unlike raw OSM tile servers, whose
            usage policy asks production apps to use an alternative
            provider). Attribution below is required by that license. */}
        <TileLayer
          // CARTO's free raster tile service began requiring an API
          // key at some point after this was first built — confirmed
          // live on production showing a visible "API KEY REQUIRED"
          // watermark, not a theoretical concern. Standard OpenStreetMap
          // tiles are the genuinely keyless fallback: no account, no
          // key, works today. Their own usage policy asks high-volume
          // production apps to use an alternative provider eventually,
          // worth revisiting if traffic grows, but this is the honest,
          // immediate fix for a map that's currently broken for every visitor.
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        {areas.map((area) => {
          const verdict = scoreVerdict(area.realvianScore);
          const color = TONE_COLORS[verdict.tone] ?? TONE_COLORS.neutral;
          return (
            <CircleMarker
              key={area.slug}
              center={[area.lat, area.lng]}
              radius={9}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: color,
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <div style={{ minWidth: 180, fontFamily: "inherit" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                    {area.district}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7488", marginBottom: 8 }}>
                    {area.city} · {area.outcode}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                    <span>Realvian Score</span>
                    <strong>{area.realvianScore}/100</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                    <span>Avg. price</span>
                    <strong>{fmtGBP(area.avgPrice)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 10 }}>
                    <span>Gross yield</span>
                    <strong>{area.grossYield.toFixed(1)}%</strong>
                  </div>
                  <Link
                    href={`/areas/${area.slug}`}
                    style={{ color: "#0EA672", fontSize: 12.5, fontWeight: 500, textDecoration: "underline" }}
                  >
                    View full area guide →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
