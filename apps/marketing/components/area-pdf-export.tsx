"use client";

import { useState } from "react";
import type { Area } from "@/lib/areas";
import { fmtPrice, fmtRent, fmtYield, fmtPct } from "@/lib/areas";

const PRIMARY: [number, number, number] = [14, 166, 114]; // #0EA672
const MUTED: [number, number, number] = [138, 147, 163]; // #8A93A3
const INK: [number, number, number] = [15, 23, 32]; // #0F1720
const BORDER: [number, number, number] = [226, 232, 238];

/**
 * Client-side generation (jsPDF), not a server route — deliberately,
 * to avoid adding a heavyweight PDF-rendering dependency (e.g.
 * Puppeteer/a headless browser) to the production server for what's
 * a one-page, mostly-text report. jsPDF runs entirely in the
 * visitor's own browser; the server never touches PDF generation at
 * all, so there's no new server-side risk from this feature.
 */
export function AreaPdfExport({ area }: { area: Area }) {
  const [generating, setGenerating] = useState(false);

  async function downloadPdf() {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 24;

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...PRIMARY);
      doc.text("REALVIAN", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text("Area Intelligence Report", pageWidth - margin, y, { align: "right" });
      y += 12;

      // Area name + score
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(...INK);
      doc.text(area.district, margin, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(...MUTED);
      doc.text(`${area.city} \u00b7 ${area.outcode}`, margin, y);

      // Score badge, top right
      doc.setDrawColor(...PRIMARY);
      doc.setLineWidth(1.2);
      doc.circle(pageWidth - margin - 12, y - 4, 12, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...INK);
      doc.text(String(area.realvianScore), pageWidth - margin - 12, y - 2, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED);
      doc.text("SCORE", pageWidth - margin - 12, y + 2, { align: "center" });

      y += 14;
      doc.setDrawColor(...BORDER);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Market figures
      const figures: [string, string][] = [
        ["Average price", fmtPrice(area.avgPrice)],
        ["Average rent", fmtRent(area.avgRent)],
        ["Gross yield", fmtYield(area.grossYield)],
        ["5-year growth", fmtPct(area.fiveYearGrowth)],
        ["Investment score", `${area.investmentScore}/100`],
        ["Typical time on market", `${area.timeOnMarket} days`],
      ];
      const colWidth = (pageWidth - margin * 2) / 2;
      figures.forEach(([label, value], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = margin + col * colWidth;
        const fy = y + row * 16;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...MUTED);
        doc.text(label.toUpperCase(), x, fy);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...INK);
        doc.text(value, x, fy + 6);
      });
      y += 3 * 16 + 6;

      doc.setDrawColor(...BORDER);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Six dimensions with simple bar visualization
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...INK);
      doc.text("Liveability dimensions", margin, y);
      y += 8;

      const barMaxWidth = pageWidth - margin * 2 - 45;
      for (const dim of area.dimensions) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...INK);
        doc.text(dim.label, margin, y + 3.5);

        const barX = margin + 38;
        doc.setFillColor(...BORDER);
        doc.rect(barX, y, barMaxWidth, 3, "F");
        doc.setFillColor(...PRIMARY);
        doc.rect(barX, y, (barMaxWidth * dim.value) / 100, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(String(dim.value), barX + barMaxWidth + 6, y + 3.5);
        y += 10;
      }

      y += 6;
      doc.setDrawColor(...BORDER);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Summary
      if (area.summary) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...INK);
        const lines = doc.splitTextToSize(area.summary, pageWidth - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 6;
      }

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(
        `Generated by realvian.co.uk on ${new Date().toLocaleDateString("en-GB")} \u00b7 realvian.co.uk/areas/${area.slug}`,
        margin,
        pageHeight - 12,
      );
      doc.text(
        "Illustrative figures where noted \u2014 not financial advice. Verify independently before making a purchase decision.",
        margin,
        pageHeight - 8,
      );

      doc.save(`realvian-${area.slug}.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={downloadPdf}
      disabled={generating}
      className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-[13.5px] font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors disabled:opacity-60"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {generating ? "Generating…" : "Download PDF report"}
    </button>
  );
}
