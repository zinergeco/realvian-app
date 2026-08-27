"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  type Area,
  fmtPrice,
  fmtRent,
  fmtPct,
  fmtYield,
} from "@/lib/areas";
import { saveComparisonAction } from "@/lib/comparison-actions";
import { ScoreRing, DataNote } from "./area-viz";
import { Button, Card, cx } from "./ui";
import { DimensionRadar } from "./dimension-radar";

/* ── Area picker dropdown ───────────────────────── */
function AreaPicker({
  areas,
  selected,
  onSelect,
  label,
  excludeSlug,
}: {
  areas: Area[];
  selected?: Area;
  onSelect: (a: Area) => void;
  label: string;
  excludeSlug?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const pool = areas.filter((a) => a.slug !== excludeSlug);
    if (!query.trim()) return pool;
    const q = query.toLowerCase();
    return pool.filter(
      (a) =>
        a.district.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.outcode.toLowerCase().includes(q),
    );
  }, [areas, query, excludeSlug]);

  return (
    <div className="relative">
      <label className="block text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--text-muted)] mb-2">
        {label}
      </label>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full flex items-center justify-between gap-3 px-4 h-[52px]
                   bg-[var(--surface)] border border-[var(--border-strong)]
                   rounded-[var(--radius-md)] text-left transition-colors
                   hover:border-[var(--primary)]"
      >
        {selected ? (
          <span className="min-w-0 flex items-center gap-2.5">
            <span
              className="tnum text-[12.5px] font-semibold shrink-0"
              style={{ color: "var(--primary)" }}
            >
              {selected.outcode}
            </span>
            <span className="text-[15px] text-[var(--text-primary)] truncate">
              {selected.district}, {selected.city}
            </span>
          </span>
        ) : (
          <span className="text-[15px] text-[var(--text-muted)]">Choose an area…</span>
        )}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="2"
          strokeLinecap="round"
          className="shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="listbox"
            className="absolute z-40 top-[calc(100%+6px)] inset-x-0 max-h-[340px] overflow-auto
                       bg-[var(--surface-raised)] border border-[var(--border)]
                       rounded-[var(--radius-md)] shadow-[var(--shadow-lg)]"
          >
            <div className="sticky top-0 p-2.5 bg-[var(--surface-raised)] border-b border-[var(--border)]">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search area, city or postcode…"
                aria-label="Search areas"
                className="w-full h-9 px-3 bg-[var(--bg-subtle)] border border-[var(--border)]
                           rounded-[var(--radius-sm)] text-[13.5px] text-[var(--text-primary)]
                           placeholder:text-[var(--text-muted)] outline-none
                           focus:border-[var(--primary)]"
              />
            </div>
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-[13.5px] text-[var(--text-muted)] text-center">
                No areas match “{query}”.
              </p>
            )}
            {filtered.map((a) => (
              <button
                key={a.slug}
                role="option"
                aria-selected={selected?.slug === a.slug}
                onClick={() => {
                  onSelect(a);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                           transition-colors hover:bg-[var(--surface-hover)]"
              >
                <span
                  className="tnum text-[12px] font-semibold w-11 shrink-0"
                  style={{ color: "var(--primary)" }}
                >
                  {a.outcode}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] text-[var(--text-primary)] truncate">
                    {a.district}
                  </span>
                  <span className="block text-[11.5px] text-[var(--text-muted)]">{a.city}</span>
                </span>
                <span className="tnum text-[13px] font-semibold text-[var(--text-primary)] shrink-0">
                  {a.realvianScore}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── One comparison row ─────────────────────────── */
function CompareRow({
  label,
  valueA,
  valueB,
  rawA,
  rawB,
  /** Which direction is "better" — some metrics are inverted (price, time on market) */
  higherIsBetter = true,
  hint,
}: {
  label: string;
  valueA: string;
  valueB: string;
  rawA: number;
  rawB: number;
  higherIsBetter?: boolean;
  hint?: string;
}) {
  const aWins = higherIsBetter ? rawA > rawB : rawA < rawB;
  const bWins = higherIsBetter ? rawB > rawA : rawB < rawA;
  const max = Math.max(rawA, rawB) || 1;

  return (
    <tr className="border-b border-[var(--border)] last:border-0">
      {/* A */}
      <td className="py-4 pr-3 w-[34%]">
        <div className="flex items-center justify-end gap-3">
          <div className="min-w-0 text-right">
            <div
              className={cx(
                "tnum text-[15px] font-semibold",
                aWins ? "" : "text-[var(--text-secondary)]",
              )}
              style={aWins ? { color: "var(--primary)" } : undefined}
            >
              {valueA}
            </div>
          </div>
          <div className="w-16 sm:w-24 h-[6px] rounded-full bg-[var(--bg-inset)] overflow-hidden shrink-0">
            <div
              className="h-full rounded-full ml-auto"
              style={{
                width: `${(rawA / max) * 100}%`,
                background: aWins ? "var(--primary)" : "var(--border-strong)",
              }}
            />
          </div>
        </div>
      </td>

      {/* Label */}
      <td className="py-4 px-2 sm:px-4 text-center w-[32%]">
        <div className="text-[13px] font-medium text-[var(--text-primary)]">{label}</div>
        {hint && (
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5 hidden sm:block">{hint}</div>
        )}
      </td>

      {/* B */}
      <td className="py-4 pl-3 w-[34%]">
        <div className="flex items-center gap-3">
          <div className="w-16 sm:w-24 h-[6px] rounded-full bg-[var(--bg-inset)] overflow-hidden shrink-0">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(rawB / max) * 100}%`,
                background: bWins ? "var(--primary)" : "var(--border-strong)",
              }}
            />
          </div>
          <div
            className={cx(
              "tnum text-[15px] font-semibold",
              bWins ? "" : "text-[var(--text-secondary)]",
            )}
            style={bWins ? { color: "var(--primary)" } : undefined}
          >
            {valueB}
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ══════════════════════════════════════════════════
   MAIN VIEW
   ══════════════════════════════════════════════════ */
export function ComparisonView({
  areas,
  initialA,
  initialB,
  isLoggedIn,
}: {
  areas: Area[];
  initialA?: Area;
  initialB?: Area;
  isLoggedIn: boolean;
}) {
  const [a, setA] = useState<Area | undefined>(initialA ?? areas[0]);
  const [b, setB] = useState<Area | undefined>(initialB ?? areas[10]);
  const [copied, setCopied] = useState(false);
  const [saveState, saveAction, savePending] = useActionState(saveComparisonAction, {});

  const shareUrl =
    a && b ? `https://realvian.co.uk/compare?a=${a.slug}&b=${b.slug}` : "";

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard unavailable — non-critical */
    }
  };

  /* Verdict: who wins on liveability vs investment */
  const verdict = useMemo(() => {
    if (!a || !b) return null;
    const liveWinner = a.realvianScore >= b.realvianScore ? a : b;
    const investWinner = a.investmentScore >= b.investmentScore ? a : b;
    const same = liveWinner.slug === investWinner.slug;
    return { liveWinner, investWinner, same };
  }, [a, b]);

  return (
    <section className="mx-auto max-w-[1240px] px-5 sm:px-8 py-12">
      {/* Pickers */}
      <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-5 items-end mb-10">
        <AreaPicker
          areas={areas}
          selected={a}
          onSelect={setA}
          label="First area"
          excludeSlug={b?.slug}
        />
        <div className="hidden sm:flex items-center justify-center pb-3.5">
          <span
            className="text-[13px] font-medium tracking-[0.12em] uppercase text-[var(--text-muted)]"
            aria-hidden="true"
          >
            vs
          </span>
        </div>
        <AreaPicker
          areas={areas}
          selected={b}
          onSelect={setB}
          label="Second area"
          excludeSlug={a?.slug}
        />
      </div>

      {!a || !b ? (
        <Card className="p-12 text-center">
          <p className="text-[15px] text-[var(--text-secondary)]">
            Choose two areas above to compare them.
          </p>
        </Card>
      ) : (
        <>
          {/* ── Verdict ── */}
          {verdict && (
            <Card className="p-6 sm:p-8 mb-6">
              <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                {/* A summary */}
                <div className="flex items-center gap-4 justify-center sm:justify-end text-right">
                  <div className="min-w-0">
                    <Link
                      href={`/areas/${a.slug}`}
                      className="block text-[20px] text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors truncate"
                      style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                    >
                      {a.district}
                    </Link>
                    <p className="text-[12.5px] text-[var(--text-muted)]">
                      {a.city} · {a.outcode}
                    </p>
                  </div>
                  <ScoreRing score={a.realvianScore} size={76} />
                </div>

                <div className="text-center">
                  <span className="text-[11.5px] tracking-[0.12em] uppercase text-[var(--text-muted)]">
                    Realvian Score
                  </span>
                </div>

                {/* B summary */}
                <div className="flex items-center gap-4 justify-center sm:justify-start">
                  <ScoreRing score={b.realvianScore} size={76} />
                  <div className="min-w-0">
                    <Link
                      href={`/areas/${b.slug}`}
                      className="block text-[20px] text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors truncate"
                      style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                    >
                      {b.district}
                    </Link>
                    <p className="text-[12.5px] text-[var(--text-muted)]">
                      {b.city} · {b.outcode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Plain-English takeaway */}
              <div className="mt-7 pt-6 border-t border-[var(--border)]">
                <p className="text-[14.5px] leading-relaxed text-[var(--text-secondary)] text-center max-w-[640px] mx-auto">
                  {verdict.same ? (
                    <>
                      <strong className="text-[var(--text-primary)]">
                        {verdict.liveWinner.district}
                      </strong>{" "}
                      leads on both liveability and investment potential — an
                      unusual combination, and worth taking seriously.
                    </>
                  ) : (
                    <>
                      <strong className="text-[var(--text-primary)]">
                        {verdict.liveWinner.district}
                      </strong>{" "}
                      scores higher for living in;{" "}
                      <strong className="text-[var(--text-primary)]">
                        {verdict.investWinner.district}
                      </strong>{" "}
                      scores higher as an investment. Which matters depends on
                      whether you intend to live there.
                    </>
                  )}
                </p>
              </div>
            </Card>
          )}

          {/* ── Market figures ── */}
          <Card className="overflow-hidden mb-6">
            <div className="px-5 sm:px-7 py-4 border-b border-[var(--border)] bg-[var(--bg-subtle)]">
              <h2 className="text-[13px] font-semibold tracking-[0.06em] uppercase text-[var(--text-primary)]">
                Market figures
              </h2>
            </div>
            <div className="px-3 sm:px-6">
              <table className="w-full">
                <caption className="sr-only">
                  Market figures comparing {a.district} and {b.district}
                </caption>
                <tbody>
                  <CompareRow
                    label="Average price"
                    hint="Lower is better for buyers"
                    valueA={fmtPrice(a.avgPrice)}
                    valueB={fmtPrice(b.avgPrice)}
                    rawA={a.avgPrice}
                    rawB={b.avgPrice}
                    higherIsBetter={false}
                  />
                  <CompareRow
                    label="Average rent"
                    valueA={fmtRent(a.avgRent)}
                    valueB={fmtRent(b.avgRent)}
                    rawA={a.avgRent}
                    rawB={b.avgRent}
                  />
                  <CompareRow
                    label="Gross yield"
                    hint="Annual rent ÷ purchase price"
                    valueA={fmtYield(a.grossYield)}
                    valueB={fmtYield(b.grossYield)}
                    rawA={a.grossYield}
                    rawB={b.grossYield}
                  />
                  <CompareRow
                    label="5-year growth"
                    valueA={fmtPct(a.fiveYearGrowth)}
                    valueB={fmtPct(b.fiveYearGrowth)}
                    rawA={a.fiveYearGrowth}
                    rawB={b.fiveYearGrowth}
                  />
                  <CompareRow
                    label="Time on market"
                    hint="Fewer days = hotter market"
                    valueA={`${a.timeOnMarket} days`}
                    valueB={`${b.timeOnMarket} days`}
                    rawA={a.timeOnMarket}
                    rawB={b.timeOnMarket}
                    higherIsBetter={false}
                  />
                  <CompareRow
                    label="Investment score"
                    valueA={`${a.investmentScore}/100`}
                    valueB={`${b.investmentScore}/100`}
                    rawA={a.investmentScore}
                    rawB={b.investmentScore}
                  />
                </tbody>
              </table>
            </div>
          </Card>

          {/* ── Liveability dimensions ── */}
          <Card className="overflow-hidden mb-6">
            <div className="px-5 sm:px-7 py-4 border-b border-[var(--border)] bg-[var(--bg-subtle)]">
              <h2 className="text-[13px] font-semibold tracking-[0.06em] uppercase text-[var(--text-primary)]">
                Liveability dimensions
              </h2>
            </div>
            <div className="px-3 sm:px-6 pt-5">
              <DimensionRadar
                dimensionsA={a.dimensions}
                dimensionsB={b.dimensions}
                nameA={a.district}
                nameB={b.district}
              />
            </div>
            <div className="px-3 sm:px-6 pb-2">
              <table className="w-full">
                <caption className="sr-only">
                  Liveability dimensions comparing {a.district} and {b.district}
                </caption>
                <tbody>
                  {a.dimensions.map((dA, i) => {
                    const dB = b.dimensions[i];
                    if (!dB) return null;
                    return (
                      <CompareRow
                        key={dA.key}
                        label={dA.label}
                        valueA={String(dA.value)}
                        valueB={String(dB.value)}
                        rawA={dA.value}
                        rawB={dB.value}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ── Actions ── */}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={copyLink}>
              {copied ? "Link copied" : "Copy shareable link"}
            </Button>
            {isLoggedIn ? (
              <form action={saveAction}>
                <input type="hidden" name="areaA" value={a.slug} />
                <input type="hidden" name="areaB" value={b.slug} />
                <Button variant="secondary" type="submit" disabled={savePending}>
                  {savePending
                    ? "Saving…"
                    : saveState?.ok
                      ? "Saved ✓"
                      : "Save this comparison"}
                </Button>
              </form>
            ) : (
              <Link href="/auth/signup">
                <Button variant="secondary">Sign in to save</Button>
              </Link>
            )}
            <Link href={`/areas/${a.slug}`}>
              <Button variant="ghost">View {a.district} in full</Button>
            </Link>
            <Link href={`/areas/${b.slug}`}>
              <Button variant="ghost">View {b.district} in full</Button>
            </Link>
          </div>

          {saveState?.error && (
            <p className="mt-3 text-[13.5px]" style={{ color: "var(--danger)" }}>
              {saveState.error}
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-[var(--border)]">
            <DataNote date={a.lastRefreshedAt} />
          </div>
        </>
      )}
    </section>
  );
}
