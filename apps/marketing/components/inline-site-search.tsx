"use client";

import Link from "next/link";
import { useState } from "react";
import { searchIndex, type SearchItem } from "@/lib/search-index";

const TYPE_LABELS: Record<SearchItem["type"], string> = {
  area: "Area",
  report: "Report",
};

export function InlineSiteSearch({ index }: { index: SearchItem[] }) {
  const [query, setQuery] = useState("");
  const results = searchIndex(query, index, 6);

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] shrink-0">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search areas and reports…"
          aria-label="Search areas and reports"
          autoFocus
          className="flex-1 bg-transparent outline-none text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      {query.trim().length > 0 && (
        <div className="mt-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden text-left">
          {results.length === 0 ? (
            <p className="px-4 py-4 text-center text-[13px] text-[var(--text-muted)]">
              No matches for &ldquo;{query}&rdquo;
            </p>
          ) : (
            results.map((r) => (
              <Link
                key={r.url}
                href={r.url}
                className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-[13.5px] text-[var(--text-primary)] truncate">{r.title}</div>
                  <div className="text-[12px] text-[var(--text-muted)] truncate">{r.subtitle}</div>
                </div>
                <span
                  className="shrink-0 text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}
                >
                  {TYPE_LABELS[r.type]}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
