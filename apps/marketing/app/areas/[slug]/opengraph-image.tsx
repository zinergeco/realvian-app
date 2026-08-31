import { ImageResponse } from "next/og";
import { getAreaBySlug, scoreVerdict } from "@/lib/areas";

export const runtime = "edge";
export const alt = "Realvian area score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Matches components/ui.tsx's exact Badge tone colours — accent
// (gold), primary (emerald), neutral (muted gray) — the same
// convention used by the map, radar charts, and every other
// score-coloured element on the site. Fixed hex, not CSS variables:
// ImageResponse renders via Satori, not a real browser DOM, so
// var(--foo) has nothing to resolve against — this is a static image
// snapshot at generation time, not a themed page render, so that's
// the right choice here, not a workaround.
const TONE_COLORS: Record<string, string> = {
  accent: "#F2B134",
  primary: "#0EA672",
  neutral: "#8A93A3",
};

function fmtGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = getAreaBySlug(slug);

  // Falls back to a generic-but-still-real image rather than a
  // broken/blank one if a slug somehow doesn't resolve — the actual
  // page route already 404s for a bad slug (see app/areas/[slug]/page.tsx),
  // so this case is more "defensive" than "expected to happen."
  if (!area) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#FBFCFB", fontSize: 48, fontFamily: "Georgia, serif" }}>
          Realvian — UK Area Intelligence
        </div>
      ),
      { ...size },
    );
  }

  const color = TONE_COLORS[scoreVerdict(area.realvianScore).tone] ?? TONE_COLORS.neutral;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "72px",
          background: "linear-gradient(135deg, #FBFCFB 0%, #F0F7F4 100%)",
        }}
      >
        {/* Score ring */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: `14px solid ${color}`,
            flexShrink: 0,
            marginRight: 56,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 76, fontWeight: 600, color: "#0F1720", fontFamily: "Georgia, serif" }}>
              {area.realvianScore}
            </div>
            <div style={{ display: "flex", fontSize: 20, color: "#8A93A3", fontFamily: "Arial, sans-serif" }}>
              SCORE
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 22, color: color, fontWeight: 600, marginBottom: 12, fontFamily: "Arial, sans-serif" }}>
            REALVIAN AREA GUIDE
          </div>
          <div style={{ display: "flex", fontSize: 60, fontWeight: 600, color: "#0F1720", fontFamily: "Georgia, serif", marginBottom: 8 }}>
            {area.district}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#4A5568", marginBottom: 36, fontFamily: "Arial, sans-serif" }}>
            {area.city} · {area.outcode}
          </div>
          <div style={{ display: "flex", gap: 40 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 18, color: "#8A93A3", fontFamily: "Arial, sans-serif" }}>AVG PRICE</div>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 600, color: "#0F1720", fontFamily: "Arial, sans-serif" }}>{fmtGBP(area.avgPrice)}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 18, color: "#8A93A3", fontFamily: "Arial, sans-serif" }}>GROSS YIELD</div>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 600, color: "#0EA672", fontFamily: "Arial, sans-serif" }}>{area.grossYield.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
