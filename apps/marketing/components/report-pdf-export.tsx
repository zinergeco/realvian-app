"use client";

import { useState } from "react";
import type { BlogPost } from "@/lib/blog";

const PRIMARY: [number, number, number] = [14, 166, 114];
const GOLD: [number, number, number] = [242, 177, 52];
const MUTED: [number, number, number] = [138, 147, 163];
const INK: [number, number, number] = [15, 23, 32];
const BORDER: [number, number, number] = [226, 232, 238];

/**
 * Same client-side jsPDF approach as the area and comparison PDF
 * exports — deliberately reused, not re-invented. This one is
 * genuinely more complex than those two: report length varies a lot
 * (a handful of paragraphs vs. a full ranking table), so this needs
 * real multi-page handling, which the single-page area/comparison
 * reports didn't.
 */
export function ReportPdfExport({ post }: { post: BlogPost }) {
  const [generating, setGenerating] = useState(false);

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

      // Header (repeated on every page footer, drawn once here for page 1's top)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...PRIMARY);
      doc.text("REALVIAN", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text("Market Report", pageWidth - margin, y, { align: "right" });
      y += 12;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.setTextColor(...INK);
      const titleLines = doc.splitTextToSize(post.title, pageWidth - margin * 2);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 7 + 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...MUTED);
      const excerptLines = doc.splitTextToSize(post.excerpt, pageWidth - margin * 2);
      doc.text(excerptLines, margin, y);
      y += excerptLines.length * 5 + 8;

      doc.setDrawColor(...BORDER);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      for (const section of post.sections) {
        ensureSpace(14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...INK);
        doc.text(section.heading, margin, y);
        y += 8;

        for (const para of section.paragraphs) {
          const lines = doc.splitTextToSize(para, pageWidth - margin * 2);
          ensureSpace(lines.length * 5 + 4);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(...INK);
          doc.text(lines, margin, y);
          y += lines.length * 5 + 4;
        }

        // Inline stat callouts, if present
        if (section.stats && section.stats.length > 0) {
          ensureSpace(16);
          const statWidth = (pageWidth - margin * 2) / section.stats.length;
          section.stats.forEach((stat, i) => {
            const x = margin + i * statWidth;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(...(stat.accent ? GOLD : PRIMARY));
            doc.text(stat.value, x, y);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(...MUTED);
            doc.text(stat.label.toUpperCase(), x, y + 5);
          });
          y += 14;
        }

        // Chart data rendered as a simple horizontal bar list - the
        // real numeric values driving bar length, the pre-formatted
        // display string shown alongside (same source data as the
        // live page's own chart, see lib/blog.ts's PostSection.chart
        // comment on why display strings aren't re-derived from the
        // table).
        if (section.chart && section.chart.length > 0) {
          const maxValue = Math.max(...section.chart.map((c) => c.value));
          const barMaxWidth = pageWidth - margin * 2 - 60;
          for (const item of section.chart) {
            ensureSpace(9);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(...INK);
            const labelLines = doc.splitTextToSize(item.label, 46);
            doc.text(labelLines[0], margin, y + 3);

            doc.setFillColor(...BORDER);
            doc.rect(margin + 48, y, barMaxWidth, 3.5, "F");
            doc.setFillColor(...PRIMARY);
            doc.rect(margin + 48, y, (barMaxWidth * item.value) / maxValue, 3.5, "F");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.text(item.displayValue, margin + 48 + barMaxWidth + 4, y + 3);
            y += 8;
          }
          y += 4;
        }

        // Table data, rendered as simple aligned text rows
        if (section.table && section.table.rows.length > 0) {
          const { columns, rows } = section.table;
          const colWidth = (pageWidth - margin * 2) / columns.length;

          ensureSpace(8);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(...MUTED);
          columns.forEach((col, i) => {
            doc.text(col.toUpperCase(), margin + i * colWidth, y);
          });
          y += 5;
          doc.setDrawColor(...BORDER);
          doc.line(margin, y, pageWidth - margin, y);
          y += 5;

          for (const row of rows) {
            ensureSpace(6);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(...INK);
            row.forEach((cell, i) => {
              doc.text(String(cell), margin + i * colWidth, y);
            });
            y += 6;
          }
          y += 4;
        }

        y += 4;
      }

      // Footer on every page
      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        doc.text(
          `Generated by realvian.co.uk on ${new Date().toLocaleDateString("en-GB")} \u00b7 realvian.co.uk/blog/${post.slug}`,
          margin,
          pageHeight - 12,
        );
        doc.text(`Page ${p} of ${pageCount}`, pageWidth - margin, pageHeight - 12, { align: "right" });
        doc.text(
          "This report is generated from Realvian's area dataset, not written by hand. Not financial advice.",
          margin,
          pageHeight - 8,
        );
      }

      doc.save(`realvian-${post.slug}.pdf`);
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
