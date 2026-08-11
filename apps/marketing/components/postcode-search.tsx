"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllAreas } from "@/lib/areas";
import { Button, cx } from "./ui";

/**
 * The single most-used input on the platform (BUILD_SPEC 3.3).
 * Built once here, reused in the nav, the comparison tool, and every
 * calculator. Accepts a postcode, an outcode, a city, or a district name.
 */

export function PostcodeSearch() {
  const router = useRouter();
  const areas = useMemo(() => getAllAreas(), []);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const pool = query.trim()
      ? areas.filter((a) => {
          const q = query.toLowerCase();
          return (
            a.outcode.toLowerCase().includes(q) ||
            a.district.toLowerCase().includes(q) ||
            a.city.toLowerCase().includes(q)
          );
        })
      : [...areas].sort((x, y) => y.realvianScore - x.realvianScore);
    return pool.slice(0, 5);
  }, [areas, query]);

  const go = (slug: string) => {
    setOpen(false);
    router.push(`/areas/${slug}`);
  };

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      const pick = filtered[active];
      if (pick) {
        e.preventDefault();
        go(pick.slug);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex gap-2.5">
        <div className="relative flex-1">
          {/* Search icon */}
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7.5" />
            <path d="M16.5 16.5L21 21" />
          </svg>

          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Enter a postcode, area or city…"
            aria-label="Search for an area"
            aria-expanded={open}
            aria-autocomplete="list"
            role="combobox"
            aria-controls="postcode-listbox"
            className="w-full h-[52px] pl-11 pr-4 bg-[var(--surface)]
                       text-[var(--text-primary)] text-[15px]
                       border border-[var(--border-strong)]
                       rounded-[var(--radius-md)]
                       placeholder:text-[var(--text-muted)]
                       shadow-[var(--shadow-sm)] outline-none
                       transition-all duration-200
                       focus:border-[var(--primary)]
                       focus:shadow-[var(--shadow-md)]"
          />
        </div>
        <Button
          size="lg"
          variant="primary"
          className="shrink-0"
          onClick={() => {
            const pick = filtered[0];
            if (pick) go(pick.slug);
          }}
        >
          Search
        </Button>
      </div>

      {/* ── Dropdown ── */}
      {open && filtered.length > 0 && (
        <div
          id="postcode-listbox"
          role="listbox"
          className="absolute z-40 top-[calc(100%+8px)] inset-x-0
                     bg-[var(--surface-raised)] border border-[var(--border)]
                     rounded-[var(--radius-md)] shadow-[var(--shadow-lg)]
                     overflow-hidden animate-fade"
        >
          <div className="px-4 py-2.5 border-b border-[var(--border)]">
            <span className="text-[10.5px] font-medium tracking-[0.12em] uppercase text-[var(--text-muted)]">
              {query.trim() ? "Matching areas" : "Popular areas"}
            </span>
          </div>

          {filtered.map((s, i) => (
            <button
              key={s.outcode}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(s.slug)}
              className={cx(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                i === active ? "bg-[var(--surface-hover)]" : "bg-transparent",
              )}
            >
              <span
                className="tnum text-[13px] font-semibold w-11 shrink-0"
                style={{ color: "var(--primary)" }}
              >
                {s.outcode}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] text-[var(--text-primary)] truncate">
                  {s.district}
                </span>
                <span className="block text-[12px] text-[var(--text-muted)]">
                  {s.city}
                </span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="tnum text-[13px] font-semibold text-[var(--text-primary)]">
                  {s.realvianScore}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                  score
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
