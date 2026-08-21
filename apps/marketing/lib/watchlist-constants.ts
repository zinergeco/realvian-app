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
