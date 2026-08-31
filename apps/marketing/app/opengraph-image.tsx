import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Realvian — UK Property Intelligence Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// System font stack, not the site's actual Fraunces/Inter webfonts —
// ImageResponse needs custom fonts fetched as raw bytes at generation
// time, and this environment can't verify a fetch to Google Fonts
// works (same network restriction hit elsewhere this session). A
// clean system serif/sans still reads as professional in a link
// preview shown for a few seconds; not worth the added fragility of
// an external font fetch failing silently in production.
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background: "linear-gradient(135deg, #FBFCFB 0%, #F0F7F4 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 44,
            fontWeight: 600,
            color: "#0F1720",
            marginBottom: 32,
            fontFamily: "Georgia, serif",
          }}
        >
          R
          <span style={{ color: "#0EA672", fontStyle: "italic" }}>eal</span>
          vian
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 300,
            color: "#0F1720",
            lineHeight: 1.15,
            maxWidth: 900,
            fontFamily: "Georgia, serif",
          }}
        >
          UK property intelligence, built on fused public data
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#4A5568",
            marginTop: 28,
            fontFamily: "Arial, sans-serif",
          }}
        >
          Area scores · Yield analysis · Market comparisons
        </div>
      </div>
    ),
    { ...size },
  );
}
