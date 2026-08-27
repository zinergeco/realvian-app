"use client";

import dynamic from "next/dynamic";
import type { Area } from "@/lib/areas";

/**
 * Next.js App Router requires `ssr: false` to be called from within a
 * Client Component — calling it directly inside a Server Component
 * page (like app/areas/page.tsx) fails the build. This thin wrapper
 * exists purely to satisfy that constraint; the actual map logic
 * lives in area-map.tsx.
 */
const AreaMapInner = dynamic(() => import("./area-map").then((m) => m.AreaMap), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border)] flex items-center justify-center"
      style={{ height: "560px", background: "var(--bg-subtle)" }}
    >
      <p className="text-[13.5px] text-[var(--text-muted)]">Loading map…</p>
    </div>
  ),
});

export function AreaMapClient({ areas }: { areas: Area[] }) {
  return <AreaMapInner areas={areas} />;
}
