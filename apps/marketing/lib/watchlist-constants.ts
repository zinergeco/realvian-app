/**
 * Pure constants, deliberately in their own file with zero imports.
 *
 * lib/property-watchlist.ts (the data-access layer) imports `postgres`,
 * a Node-only package. A client component that imports ANYTHING from
 * that file — even just a constant — pulls the whole module into the
 * browser bundle and the build fails on Node built-ins (tls, fs,
 * perf_hooks) that don't exist there. This file exists so both the
 * server actions and the client card component can share one
 * definition of the status list without either side risking that.
 */

export const WATCHLIST_STATUSES = [
  "researching",
  "viewing_booked",
  "viewed",
  "offer_made",
  "under_offer",
  "withdrawn",
] as const;

export type WatchlistStatus = (typeof WATCHLIST_STATUSES)[number];

export const STATUS_LABELS: Record<WatchlistStatus, string> = {
  researching: "Researching",
  viewing_booked: "Viewing booked",
  viewed: "Viewed",
  offer_made: "Offer made",
  under_offer: "Under offer",
  withdrawn: "Withdrawn",
};

/**
 * Generic over any item with a `status` field, rather than importing
 * the real WatchlistItem type from property-watchlist.ts — that file
 * imports postgres for its data-access functions, and this file's
 * whole reason for existing (see the comment at the top) is staying
 * safe to import from a client component. A generic keeps that true
 * without needing type-only import gymnastics.
 */
export function groupByStatus<T extends { status: WatchlistStatus }>(
  items: T[],
): Record<WatchlistStatus, T[]> {
  const groups = Object.fromEntries(
    WATCHLIST_STATUSES.map((s) => [s, [] as T[]]),
  ) as Record<WatchlistStatus, T[]>;
  for (const item of items) {
    groups[item.status].push(item);
  }
  return groups;
}
