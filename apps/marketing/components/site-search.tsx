"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchIndex, type SearchItem, type SearchResult } from "@/lib/search-index";

const TYPE_LABELS: Record<SearchItem["type"], string> = {
  area: "Area",
  report: "Report",
};

export function SiteSearch({ index }: { index: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results: SearchResult[] = searchIndex(query, index);

  // Cmd+K / Ctrl+K opens the palette from anywhere on the site, and
  // Escape closes it — the same convention as most modern command
  // palettes, so it behaves the way a user already expects without
  // needing to discover a button first.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Focus after the modal has actually mounted, not before.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function go(url: string) {
    setOpen(false);
    router.push(url);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      go(results[activeIndex]!.url);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search areas and reports"
        className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border)] text-[13px] text-[var(--text-muted)] hover:border-[var(--border-strong)] transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline text-[11px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)]">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
          style={{ background: "rgba(15, 23, 32, 0.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="w-full max-w-[560px] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-lg)]"
            style={{ background: "var(--surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] shrink-0">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search areas and reports…"
                aria-label="Search query"
                className="flex-1 bg-transparent outline-none text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div className="max-h-[360px] overflow-y-auto py-2">
              {query.trim().length === 0 ? (
                <p className="px-4 py-6 text-center text-[13px] text-[var(--text-muted)]">
                  Type a place name or report topic
                </p>
              ) : results.length === 0 ? (
                <p className="px-4 py-6 text-center text-[13px] text-[var(--text-muted)]">
                  No matches for &ldquo;{query}&rdquo;
                </p>
              ) : (
                results.map((r, i) => (
                  <button
                    key={r.url}
                    type="button"
                    onClick={() => go(r.url)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left"
                    style={{ background: i === activeIndex ? "var(--bg-subtle)" : "transparent" }}
                  >
                    <div className="min-w-0">
                      <div className="text-[14px] text-[var(--text-primary)] truncate">{r.title}</div>
                      <div className="text-[12px] text-[var(--text-muted)] truncate">{r.subtitle}</div>
                    </div>
                    <span
                      className="shrink-0 text-[11px] px-2 py-0.5 rounded-full"
                      style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}
                    >
                      {TYPE_LABELS[r.type]}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
