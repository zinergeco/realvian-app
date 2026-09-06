"use client";

import { useState } from "react";
import type { Area } from "@/lib/areas";
import { fmtPrice, fmtYield, fmtPct } from "@/lib/areas";

const PRIMARY: [number, number, number] = [14, 166, 114]; // #0EA672, area A
const INFO: [number, number, number] = [45, 91, 255]; // #2D5BFF, area B - matches the same distinct hue used on /compare's radar chart, not another shade of green
const MUTED: [number, number, number] = [138, 147, 163];
const INK: [number, number, number] = [15, 23, 32];
const BORDER: [number, number, number] = [226, 232, 238];

/**
 * Same client-side jsPDF approach as area-pdf-export.tsx, deliberately
 * reused rather than re-invented — same reasoning applies (no new
 * server-side rendering dependency for a one-page report).
 */
export function ComparisonPdfExport({ a, b }: { a: Area; b: Area }) {
  const [generating, setGenerating] = useState(false);

  async function downloadPdf() {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 24;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...PRIMARY);
      doc.text("REALVIAN", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text("Area Comparison", pageWidth - margin, y, { align: "right" });
      y += 14;

      // Two area names + scores, side by side
      const colWidth = (pageWidth - margin * 2 - 10) / 2;
      const areas: [Area, [number, number, number]][] = [
        [a, PRIMARY],
        [b, INFO],
      ];
      const headerTop = y;
      areas.forEach(([area, color], i) => {
        const x = margin + i * (colWidth + 10);
        doc.setDrawColor(...color);
        doc.setLineWidth(1.1);
        doc.circle(x + 11, headerTop + 3, 11, "S");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(...INK);
        doc.text(String(area.realvianScore), x + 11, headerTop + 5, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);
        doc.setTextColor(...INK);
        doc.text(area.district, x + 26, headerTop + 1);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...MUTED);
        doc.text(`${area.city} \u00b7 ${area.outcode}`, x + 26, headerTop + 7);
      });
      y = headerTop + 20;

      doc.setDrawColor(...BORDER);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Market figures table - one row per metric, both values shown
      const rows: [string, (ar: Area) => string][] = [
        ["Average price", (ar) => fmtPrice(ar.avgPrice)],
        ["Gross yield", (ar) => fmtYield(ar.grossYield)],
        ["5-year growth", (ar) => fmtPct(ar.fiveYearGrowth)],
        ["Investment score", (ar) => `${ar.investmentScore}/100`],
      ];
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...INK);
      doc.text("Market figures", margin, y);
      y += 8;

      for (const [label, fmt] of rows) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...MUTED);
        doc.text(label, margin, y);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...PRIMARY);
        doc.text(fmt(a), margin + 85, y);
        doc.setTextColor(...INFO);
        doc.text(fmt(b), margin + 130, y);
        y += 8;
      }

      y += 4;
      doc.setDrawColor(...BORDER);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Six dimensions, both areas' values on the same row
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...INK);
      doc.text("Liveability dimensions", margin, y);
      y += 8;

      const barMaxWidth = 45;
      for (let i = 0; i < a.dimensions.length; i++) {
        const dimA = a.dimensions[i]!;
        const dimB = b.dimensions.find((d) => d.key === dimA.key) ?? b.dimensions[i]!;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...INK);
        doc.text(dimA.label, margin, y + 3.5);

        const labelX = margin + 32;
        doc.setFillColor(...BORDER);
        doc.rect(labelX, y, barMaxWidth, 3, "F");
        doc.setFillColor(...PRIMARY);
        doc.rect(labelX, y, (barMaxWidth * dimA.value) / 100, 3, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...PRIMARY);
        doc.text(String(dimA.value), labelX + barMaxWidth + 4, y + 3);

        const barX2 = labelX + barMaxWidth + 16;
        doc.setFillColor(...BORDER);
        doc.rect(barX2, y, barMaxWidth, 3, "F");
        doc.setFillColor(...INFO);
        doc.rect(barX2, y, (barMaxWidth * dimB.value) / 100, 3, "F");
        doc.setTextColor(...INFO);
        doc.text(String(dimB.value), barX2 + barMaxWidth + 4, y + 3);

        y += 10;
      }

      y += 6;
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setFillColor(...PRIMARY);
      doc.circle(margin + 1.5, pageHeight - 22, 1.5, "F");
      doc.setTextColor(...INK);
      doc.text(a.district, margin + 5, pageHeight - 21);
      doc.setFillColor(...INFO);
      doc.circle(margin + 40, pageHeight - 22, 1.5, "F");
      doc.text(b.district, margin + 43, pageHeight - 21);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(
        `Generated by realvian.co.uk on ${new Date().toLocaleDateString("en-GB")} \u00b7 realvian.co.uk/compare?a=${a.slug}&b=${b.slug}`,
        margin,
        pageHeight - 12,
      );
      doc.text(
        "Illustrative figures where noted \u2014 not financial advice. Verify independently before making a purchase decision.",
        margin,
        pageHeight - 8,
      );

      doc.save(`realvian-${a.slug}-vs-${b.slug}.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={downloadPdf}
      disabled={generating}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-[13.5px] font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors disabled:opacity-60"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {generating ? "Generating…" : "Download PDF"}
    </button>
  );
}
