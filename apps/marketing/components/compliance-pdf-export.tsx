"use client";

import { useState } from "react";
import type { PropertyWithUrgency, UrgencyLevel } from "@/lib/properties";

const HIGHLIGHT: [number, number, number] = [255, 111, 89]; // #FF6F59, overdue
const GOLD: [number, number, number] = [242, 177, 52]; // urgent
const PRIMARY: [number, number, number] = [14, 166, 114]; // ok
const MUTED: [number, number, number] = [138, 147, 163]; // unknown / general muted
const INK: [number, number, number] = [15, 23, 32];
const BORDER: [number, number, number] = [226, 232, 238];

const URGENCY_COLOR: Record<UrgencyLevel, [number, number, number]> = {
  overdue: HIGHLIGHT,
  urgent: GOLD,
  ok: PRIMARY,
  unknown: MUTED,
};

const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  overdue: "Overdue",
  urgent: "Due soon",
  ok: "Up to date",
  unknown: "No dates set",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Same client-side jsPDF approach as the other four PDF exports on
 * this site — deliberately reused, not re-invented, same reasoning
 * each time. Properties are pre-sorted by urgency (sortByUrgency,
 * already applied by the caller — this component just renders the
 * order it's given, matching exactly what's on screen).
 */
export function CompliancePdfExport({ properties }: { properties: PropertyWithUrgency[] }) {
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

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...PRIMARY);
      doc.text("REALVIAN", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text("Compliance Summary", pageWidth - margin, y, { align: "right" });
      y += 12;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.setTextColor(...INK);
      doc.text(`${properties.length} propert${properties.length === 1 ? "y" : "ies"}`, margin, y);
      y += 10;

      // Counts by urgency - a landlord's first question is "what
      // needs my attention right now", not the full detail table.
      const counts: Record<UrgencyLevel, number> = { overdue: 0, urgent: 0, ok: 0, unknown: 0 };
      for (const p of properties) counts[p.urgency]++;
      const levels: UrgencyLevel[] = ["overdue", "urgent", "ok", "unknown"];
      const statWidth = (pageWidth - margin * 2) / 4;
      levels.forEach((level, i) => {
        const x = margin + i * statWidth;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(...URGENCY_COLOR[level]);
        doc.text(String(counts[level]), x, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        doc.text(URGENCY_LABEL[level].toUpperCase(), x, y + 5);
      });
      y += 14;

      doc.setDrawColor(...BORDER);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      const columns = ["Property", "Status", "EPC", "Gas safety", "EICR"];
      const colWidths = [42, 24, 32, 32, 32];
      const colX = [margin];
      for (let i = 0; i < colWidths.length - 1; i++) colX.push(colX[i]! + colWidths[i]!);

      ensureSpace(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      columns.forEach((col, i) => doc.text(col.toUpperCase(), colX[i]!, y));
      y += 5;
      doc.setDrawColor(...BORDER);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      for (const p of properties) {
        ensureSpace(7);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...INK);
        doc.text(p.nickname, colX[0]!, y);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...URGENCY_COLOR[p.urgency]);
        doc.text(URGENCY_LABEL[p.urgency], colX[1]!, y);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...INK);
        doc.text(fmtDate(p.epcExpiry), colX[2]!, y);
        doc.text(fmtDate(p.gasSafetyExpiry), colX[3]!, y);
        doc.text(fmtDate(p.eicrExpiry), colX[4]!, y);
        y += 7;
      }

      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        doc.text(
          `Generated by realvian.co.uk on ${new Date().toLocaleDateString("en-GB")} \u00b7 realvian.co.uk/portals/landlord`,
          margin,
          pageHeight - 12,
        );
        doc.text(`Page ${p} of ${pageCount}`, pageWidth - margin, pageHeight - 12, { align: "right" });
        doc.text(
          "Self-reported dates, not verified against a national register. Confirm directly with your provider before relying on this for a compliance decision.",
          margin,
          pageHeight - 8,
        );
      }

      doc.save("realvian-compliance-summary.pdf");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={downloadPdf}
      disabled={generating || properties.length === 0}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-[13.5px] font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors disabled:opacity-60"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {generating ? "Generating…" : "Download compliance PDF"}
    </button>
  );
}
