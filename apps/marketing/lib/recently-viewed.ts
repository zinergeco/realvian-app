const STORAGE_KEY = "realvian:recently-viewed";
const MAX_ENTRIES = 6;

export interface RecentAreaEntry {
  slug: string;
  district: string;
  city: string;
  outcode: string;
  realvianScore: number;
  viewedAt: string;
}

/**
 * Pure functions operating on a plain array, kept separate from the
 * actual localStorage read/write so the ordering/dedup/cap logic is
 * unit-testable without needing a browser or a localStorage mock.
 */
export function addRecentView(
  existing: RecentAreaEntry[],
  entry: Omit<RecentAreaEntry, "viewedAt">,
): RecentAreaEntry[] {
  const withoutDuplicate = existing.filter((e) => e.slug !== entry.slug);
  const next = [{ ...entry, viewedAt: new Date().toISOString() }, ...withoutDuplicate];
  return next.slice(0, MAX_ENTRIES);
}

export function readRecentViews(): RecentAreaEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    // Corrupted or inaccessible localStorage (private browsing modes
    // vary in how they handle this) — treat as empty rather than
    // throw, since this is a convenience feature, not core
    // functionality anything else depends on.
    return [];
  }
}

export function writeRecentView(entry: Omit<RecentAreaEntry, "viewedAt">): RecentAreaEntry[] {
  if (typeof window === "undefined") return [];
  const next = addRecentView(readRecentViews(), entry);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable — the write silently doesn't
    // persist, but nothing in the app depends on it succeeding.
  }
  return next;
}
