"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readRecentViews, type RecentAreaEntry } from "@/lib/recently-viewed";
import { ScoreRing } from "@/components/area-viz";

export function RecentlyViewed() {
  const [entries, setEntries] = useState<RecentAreaEntry[] | null>(null);

  useEffect(() => {
    setEntries(readRecentViews());
  }, []);

  if (!entries || entries.length === 0) return null;

  return (
    <div className="mb-10">
      <p className="text-[12.5px] font-semibold tracking-[0.04em] uppercase text-[var(--text-muted)] mb-3">
        Recently viewed
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {entries.map((e) => (
          <Link
            key={e.slug}
            href={`/areas/${e.slug}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-colors shrink-0"
          >
            <ScoreRing score={e.realvianScore} size={36} />
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">
                {e.district}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                {e.city}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
