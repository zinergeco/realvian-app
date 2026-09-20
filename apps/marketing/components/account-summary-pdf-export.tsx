"use client";

import { useState } from "react";
import type { Area } from "@/lib/areas";
import { getAreaByOutcode } from "@/lib/areas";
import type { WatchlistItem } from "@/lib/property-watchlist";
import { STATUS_LABELS } from "@/lib/watchlist-constants";

const PRIMARY: [number, number, number] = [14, 166, 114];
const INFO: [number, number, number] = [45, 91, 255];
const GOLD: [number, number, number] = [242, 177, 52];
const MUTED: [number, number, number] = [138, 147, 163];
const INK: [number, number, number] = [15, 23, 32];
const BORDER: [number, number, number] = [226, 232, 238];

interface SavedComparisonWithAreas {
  id: string;
  createdAt: string;
  a: Area;
  b: Area;
}

interface FollowedAreaWithArea {
  id: string;
  createdAt: string;
  area: Area;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

/**
 * Same client-side jsPDF approach as the other seven PDF exports on
 * this site — deliberately reused, not re-invented. Combines saved
 * comparisons, followed areas, and the property watchlist into one
 * document, since all three live on the same account page. The
 * watchlist rows reuse the same area-price comparison shown on each
 * WatchlistCard (see watchlist-card.tsx's AreaPriceContext) so the
 * PDF and the live page never show a different verdict on the same
 * property.
 */
export function AccountSummaryPdfExport({
  comparisons,
  followed,
  watchlist,
}: {
  comparisons: SavedComparisonWithAreas[];
  followed: FollowedAreaWithArea[];
  watchlist: WatchlistItem[];
}) {
  const [generating, setGenerating] = useState(false);
  const isEmpty = comparisons.length === 0 && followed.length === 0 && watchlist.length === 0;

  async function downloadPdf() {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const bottomLimit = pageHeight - 22;
      let y = 24;

      function ensureSpace(needed: number) {
        if (y + needed > bottomLimit) {
          doc.addPage();
          y = 24;
        }
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...PRIMARY);
      doc.text("REALVIAN", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text("Account Summary", pageWidth - margin, y, { align: "right" });
      y += 14;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.setTextColor(...INK);
      doc.text("Your saved areas and comparisons", margin, y);
      y += 12;

      if (comparisons.length > 0) {
        ensureSpace(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...INK);
        doc.text(`Saved comparisons (${comparisons.length})`, margin, y);
        y += 9;

        for (const c of comparisons) {
          ensureSpace(9);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(...PRIMARY);
          doc.text(String(c.a.realvianScore), margin, y);
          doc.setTextColor(...INK);
          doc.text(c.a.district, margin + 10, y);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(...MUTED);
          doc.text("vs", margin + 70, y);

          doc.setFont("helvetica", "bold");
          doc.setTextColor(...INFO);
          doc.text(String(c.b.realvianScore), margin + 80, y);
          doc.setTextColor(...INK);
          doc.text(c.b.district, margin + 90, y);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(...MUTED);
          doc.text(`Saved ${fmtDate(c.createdAt)}`, pageWidth - margin, y, { align: "right" });
          y += 8;
        }
        y += 6;
      }

      if (followed.length > 0) {
        ensureSpace(10);
        doc.setDrawColor(...BORDER);
        doc.line(margin, y, pageWidth - margin, y);
        y += 9;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...INK);
        doc.text(`Followed areas (${followed.length})`, margin, y);
        y += 9;

        for (const f of followed) {
          ensureSpace(9);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(...PRIMARY);
          doc.text(String(f.area.realvianScore), margin, y);
          doc.setTextColor(...INK);
          doc.text(`${f.area.district}, ${f.area.city}`, margin + 10, y);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(...MUTED);
          doc.text(`Followed ${fmtDate(f.createdAt)}`, pageWidth - margin, y, { align: "right" });
          y += 8;
        }
        y += 6;
      }

      if (watchlist.length > 0) {
        ensureSpace(10);
        doc.setDrawColor(...BORDER);
        doc.line(margin, y, pageWidth - margin, y);
        y += 9;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...INK);
        doc.text(`Property watchlist (${watchlist.length})`, margin, y);
        y += 9;

        for (const p of watchlist) {
          ensureSpace(9);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...INK);
          doc.text(p.nickname, margin, y);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(...MUTED);
          doc.text(p.postcode, margin + 55, y);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(...INFO);
          doc.text(STATUS_LABELS[p.status], pageWidth - margin, y, { align: "right" });
          y += 6;

          // Same area-price comparison as the live WatchlistCard shows
          // (AreaPriceContext in watchlist-card.tsx) - kept in sync
          // deliberately so the PDF and the page never disagree.
          if (p.price !== null && p.outcode) {
            const area = getAreaByOutcode(p.outcode);
            if (area) {
              const diffPct = ((p.price - area.avgPrice) / area.avgPrice) * 100;
              const rounded = Math.round(Math.abs(diffPct));
              doc.setFont("helvetica", "normal");
              doc.setFontSize(8);
              doc.setTextColor(...(rounded === 0 ? MUTED : diffPct < 0 ? PRIMARY : GOLD));
              const text =
                rounded === 0
                  ? `In line with ${area.district}'s average of ${fmtGBP(area.avgPrice)}`
                  : `${rounded}% ${diffPct < 0 ? "below" : "above"} ${area.district}'s average of ${fmtGBP(area.avgPrice)}`;
              doc.text(text, margin, y);
              y += 6;
            }
          }
          y += 2;
        }
      }

      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        doc.text(
          `Generated by realvian.co.uk on ${new Date().toLocaleDateString("en-GB")} \u00b7 realvian.co.uk/account`,
          margin,
          pageHeight - 12,
        );
        doc.text(`Page ${p} of ${pageCount}`, pageWidth - margin, pageHeight - 12, { align: "right" });
        doc.text(
          "Illustrative figures where noted \u2014 not financial advice. Verify independently before making a purchase decision.",
          margin,
          pageHeight - 8,
        );
      }

      doc.save("realvian-account-summary.pdf");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={downloadPdf}
      disabled={generating || isEmpty}
      className="print-hide inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-[13.5px] font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors disabled:opacity-60"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {generating ? "Generating…" : "Download account summary PDF"}
    </button>
  );
}
