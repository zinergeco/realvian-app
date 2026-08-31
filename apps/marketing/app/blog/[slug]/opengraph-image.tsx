import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog";
import { getAreaBySlug } from "@/lib/areas";

export const runtime = "edge";
export const alt = "Realvian market report";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PRIMARY = "#0EA672";
const GOLD = "#F2B134";
const MUTED = "#8A93A3";
const INK = "#0F1720";

function GenericCard({ title }: { title: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "linear-gradient(135deg, #FBFCFB 0%, #F0F7F4 100%)",
      }}
    >
      <div style={{ display: "flex", fontSize: 22, color: PRIMARY, fontWeight: 600, marginBottom: 20, fontFamily: "Arial, sans-serif" }}>
        REALVIAN MARKET REPORT
      </div>
      <div style={{ display: "flex", fontSize: 52, fontWeight: 600, color: INK, fontFamily: "Georgia, serif", maxWidth: 950, lineHeight: 1.2 }}>
        {title}
      </div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return new ImageResponse(<GenericCard title="Realvian Market Report" />, { ...size });
  }

  // Comparison posts: two real areas, head-to-head scores — reuses
  // exactly the same areaSlugs lookup the comparison radar chart uses
  // (see app/blog/[slug]/page.tsx), not a separate data path.
  if (post.kind === "comparison" && post.areaSlugs.length === 2) {
    const a = getAreaBySlug(post.areaSlugs[0]!);
    const b = getAreaBySlug(post.areaSlugs[1]!);
    if (a && b) {
      return new ImageResponse(
        (
          <div
            style={{
              width: "100%", height: "100%", display: "flex", flexDirection: "column",
              justifyContent: "center", padding: "72px",
              background: "linear-gradient(135deg, #FBFCFB 0%, #F0F7F4 100%)",
            }}
          >
            <div style={{ display: "flex", fontSize: 22, color: PRIMARY, fontWeight: 600, marginBottom: 32, fontFamily: "Arial, sans-serif" }}>
              REALVIAN COMPARISON
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
              {[a, b].map((area, i) => (
                <div key={area.slug} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 180, height: 180, borderRadius: "50%",
                      border: `12px solid ${i === 0 ? PRIMARY : GOLD}`, marginBottom: 20,
                    }}
                  >
                    <div style={{ display: "flex", fontSize: 64, fontWeight: 600, color: INK, fontFamily: "Georgia, serif" }}>
                      {area.realvianScore}
                    </div>
                  </div>
                  <div style={{ display: "flex", fontSize: 34, fontWeight: 600, color: INK, fontFamily: "Georgia, serif" }}>
                    {area.district}
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", fontSize: 40, color: MUTED, fontFamily: "Georgia, serif", fontStyle: "italic" }}>vs</div>
            </div>
          </div>
        ),
        { ...size },
      );
    }
  }

  // Ranking and city-report posts: both populate a chart section with
  // {label, value, displayValue}[], sorted with the leader first — the
  // exact same data the ranking chart itself renders (see
  // components/ranking-chart.tsx), not a separately-derived figure.
  const chartSection = post.sections.find((s) => s.chart && s.chart.length > 0);
  const leader = chartSection?.chart?.[0];

  if (leader) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%", height: "100%", display: "flex", flexDirection: "column",
            justifyContent: "center", padding: "80px",
            background: "linear-gradient(135deg, #FBFCFB 0%, #F0F7F4 100%)",
          }}
        >
          <div style={{ display: "flex", fontSize: 22, color: PRIMARY, fontWeight: 600, marginBottom: 24, fontFamily: "Arial, sans-serif" }}>
            REALVIAN MARKET REPORT
          </div>
          <div style={{ display: "flex", fontSize: 46, fontWeight: 600, color: INK, fontFamily: "Georgia, serif", maxWidth: 980, lineHeight: 1.2, marginBottom: 40 }}>
            {post.title}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            <div style={{ display: "flex", fontSize: 20, color: MUTED, fontFamily: "Arial, sans-serif" }}>LEADS AT</div>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 600, color: GOLD, fontFamily: "Georgia, serif" }}>
              {leader.displayValue}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 30, color: INK, fontFamily: "Arial, sans-serif", marginTop: 4 }}>
            {leader.label}
          </div>
        </div>
      ),
      { ...size },
    );
  }

  return new ImageResponse(<GenericCard title={post.title} />, { ...size });
}
