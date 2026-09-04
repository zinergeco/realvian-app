import Link from "next/link";
import { Badge, Card, cx } from "./ui";
import {
  type Area,
  type AreaDimension,
  fmtPrice,
  fmtPct,
  fmtYield,
  scoreVerdict,
} from "@/lib/areas";

/* ══════════════════════════════════════════════════
   SCORE RING — the signature Realvian Score visual
   ══════════════════════════════════════════════════ */
export function ScoreRing({
  score,
  size = 104,
  label = "Score",
  tone = "primary",
}: {
  score: number;
  size?: number;
  label?: string;
  tone?: "primary" | "accent";
}) {
  const stroke = size < 80 ? 6 : 7;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const colour = tone === "accent" ? "var(--color-gold)" : "var(--primary)";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--bg-inset)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div
            className="tnum leading-none font-semibold text-[var(--text-primary)]"
            style={{ fontSize: size * 0.3 }}
          >
            {score}
          </div>
          {/* Below this size, the label's minimum legible font size
              no longer fits the ring's available inner width and
              would silently clip (this exact bug is what broke the
              account page's rings at size=40 — "SCORE" rendered as
              "COR" with both ends cut off). Hiding it below a safe
              threshold is more honest than letting it overflow. */}
          {size >= 60 && (
            <div
              className="tracking-[0.1em] uppercase text-[var(--text-muted)] mt-0.5"
              style={{ fontSize: Math.max(8, size * 0.085) }}
            >
              {label}
            </div>
          )}
        </div>
      </div>
      <span className="sr-only">{score} out of 100</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   METRIC BARS — the dimension breakdown
   ══════════════════════════════════════════════════ */
export function MetricBars({
  dimensions,
  showDetail = false,
}: {
  dimensions: AreaDimension[];
  showDetail?: boolean;
}) {
  return (
    <ul className="space-y-4">
      {dimensions.map((d) => (
        <li key={d.key}>
          <div className="flex items-center gap-3">
            <span className="text-[13.5px] text-[var(--text-secondary)] w-[104px] shrink-0">
              {d.label}
            </span>
            <div
              className="flex-1 h-[7px] rounded-full bg-[var(--bg-inset)] overflow-hidden"
              role="meter"
              aria-valuenow={d.value}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={d.label}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${d.value}%`,
                  background:
                    d.value >= 85
                      ? "var(--primary)"
                      : d.value >= 70
                        ? "var(--color-gold)"
                        : "var(--highlight)",
                }}
              />
            </div>
            <span className="tnum text-[13px] font-medium text-[var(--text-primary)] w-8 text-right shrink-0">
              {d.value}
            </span>
          </div>
          {showDetail && (
            <p className="text-[12.5px] text-[var(--text-muted)] mt-1.5 ml-[116px] leading-relaxed">
              {d.detail}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ══════════════════════════════════════════════════
   STAT BLOCK — key figures row
   ══════════════════════════════════════════════════ */
export function StatBlock({
  stats,
  columns = 4,
}: {
  stats: { label: string; value: string; accent?: boolean; hint?: string }[];
  columns?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cx(
        "grid divide-x divide-[var(--border)] border-y border-[var(--border)]",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-4",
      )}
    >
      {stats.map((s) => (
        <div key={s.label} className="px-4 py-4 sm:px-5">
          <div className="text-[10.5px] tracking-[0.1em] uppercase text-[var(--text-muted)] mb-1.5">
            {s.label}
          </div>
          <div
            className="tnum text-[17px] font-semibold leading-none"
            style={{ color: s.accent ? "var(--primary)" : "var(--text-primary)" }}
          >
            {s.value}
          </div>
          {s.hint && (
            <div className="text-[11.5px] text-[var(--text-muted)] mt-1.5">{s.hint}</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   AREA CARD — used on hub, rankings, similar-areas
   ══════════════════════════════════════════════════ */
export function AreaCard({ area }: { area: Area }) {
  const verdict = scoreVerdict(area.realvianScore);

  return (
    <Link href={`/areas/${area.slug}`} className="group block h-full">
      <Card hover className="h-full p-5 flex gap-4">
        <ScoreRing score={area.realvianScore} size={72} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="tnum text-[12.5px] font-semibold"
              style={{ color: "var(--primary)" }}
            >
              {area.outcode}
            </span>
            <Badge tone={verdict.tone} className="!text-[9.5px] !py-0.5 !px-2">
              {verdict.label}
            </Badge>
          </div>
          <h3
            className="text-[19px] leading-tight text-[var(--text-primary)] truncate"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            {area.district}
          </h3>
          <p className="text-[12.5px] text-[var(--text-muted)] mt-0.5 mb-3">
            {area.city} · {area.region}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
            <span className="text-[var(--text-secondary)]">
              <span className="tnum font-medium text-[var(--text-primary)]">
                {fmtPrice(area.avgPrice)}
              </span>{" "}
              avg
            </span>
            <span className="text-[var(--text-secondary)]">
              <span
                className="tnum font-medium"
                style={{ color: "var(--primary)" }}
              >
                {fmtYield(area.grossYield)}
              </span>{" "}
              yield
            </span>
            <span className="text-[var(--text-secondary)]">
              <span className="tnum font-medium text-[var(--text-primary)]">
                {fmtPct(area.fiveYearGrowth)}
              </span>{" "}
              5yr
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* ══════════════════════════════════════════════════
   DATA FRESHNESS NOTE
   Legally required alongside any figure we publish.
   ══════════════════════════════════════════════════ */
export function DataNote({
  date,
  isLive = false,
  hasGeo = false,
}: {
  date: string;
  /** True once real fetched dimension data (amenities/green/transport) exists for this area */
  isLive?: boolean;
  /** True once real coordinates exist, even if dimension scores are still synthetic */
  hasGeo?: boolean;
}) {
  const formatted = new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div className="space-y-1.5">
      {isLive ? (
        <p className="text-[11.5px] font-medium text-[var(--primary)] flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-current"
            aria-hidden="true"
          />
          Amenities, green space and transport are live-fetched data
        </p>
      ) : hasGeo ? (
        <p className="text-[11.5px] font-medium text-[var(--color-gold-deep)] flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-current"
            aria-hidden="true"
          />
          Location is real ONS data — liveability scores are still illustrative
        </p>
      ) : (
        <p className="text-[11.5px] font-medium text-[var(--color-gold-deep)] flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-current"
            aria-hidden="true"
          />
          Illustrative figures — not yet backed by live data for this area
        </p>
      )}
      <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
        Data updated {formatted}. Figures are indicative and derived from public
        sources including HM Land Registry, ONS and Police.uk. Not financial advice —
        verify independently before making a purchase decision.
      </p>
    </div>
  );
}
