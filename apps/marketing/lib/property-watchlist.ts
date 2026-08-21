/**
 * PROPERTY WATCHLIST
 *
 * A buyer/investor's own tracking of properties they're evaluating.
 * Distinct from lib/properties.ts (the landlord compliance tracker) —
 * see migration 0006 for why these are deliberately separate tables.
 */

import { toOutcode, resolveGeography } from "./monetisation";
import { getAllAreas } from "./areas";
import { WATCHLIST_STATUSES, STATUS_LABELS, type WatchlistStatus } from "./watchlist-constants";

// Re-exported so existing server-side imports of these from this file
// keep working — only client components need to import them from
// watchlist-constants.ts directly instead, to avoid pulling in postgres.
export { WATCHLIST_STATUSES, STATUS_LABELS, type WatchlistStatus };

export interface WatchlistItem {
  id: string;
  nickname: string;
  postcode: string;
  outcode: string | null;
  city: string | null;
  price: number | null;
  listingUrl: string | null;
  status: WatchlistStatus;
  notes: string | null;
  createdAt: string;
}

async function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  const { default: postgres } = await import("postgres");
  return postgres(url, { max: 3, idle_timeout: 20, connect_timeout: 10 });
}

function parseRow(r: Record<string, unknown>): WatchlistItem {
  const rawStatus = String(r.status);
  const status = (WATCHLIST_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as WatchlistStatus)
    : "researching";
  return {
    id: String(r.id),
    nickname: String(r.nickname),
    postcode: String(r.postcode),
    outcode: r.outcode ? String(r.outcode) : null,
    city: r.city ? String(r.city) : null,
    price: r.price !== null && r.price !== undefined ? Number(r.price) : null,
    listingUrl: r.listing_url ? String(r.listing_url) : null,
    status,
    notes: r.notes ? String(r.notes) : null,
    createdAt: (r.created_at as Date).toISOString(),
  };
}

export async function listWatchlist(userId: string): Promise<WatchlistItem[]> {
  try {
    const sql = await db();
    try {
      const rows = await sql<Record<string, unknown>[]>`
        SELECT id, nickname, postcode, outcode, city, price, listing_url, status, notes, created_at
        FROM property_watchlist
        WHERE user_id = ${userId}::uuid
        ORDER BY created_at DESC
      `;
      return rows.map(parseRow);
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[watchlist] list failed:", err);
    return [];
  }
}

export interface AddWatchlistInput {
  nickname: string;
  postcode: string;
  price: number | null;
  listingUrl: string | null;
  notes: string | null;
}

export async function addToWatchlist(
  userId: string,
  input: AddWatchlistInput,
): Promise<{ ok: boolean; error?: string }> {
  const outcode = toOutcode(input.postcode);
  if (!outcode) return { ok: false, error: "That doesn't look like a valid UK postcode." };

  const geo = resolveGeography(input.postcode, getAllAreas());

  try {
    const sql = await db();
    try {
      await sql`
        INSERT INTO property_watchlist
          (user_id, nickname, postcode, outcode, city, region, price, listing_url)
        VALUES
          (${userId}::uuid, ${input.nickname}, ${input.postcode.toUpperCase()}, ${outcode},
           ${geo?.city ?? null}, ${geo?.region ?? null}, ${input.price}, ${input.listingUrl})
      `;
      return { ok: true };
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[watchlist] add failed:", err);
    return { ok: false, error: "Could not save this property." };
  }
}

/** Ownership enforced in the query itself, same pattern used throughout. */
export async function updateWatchlistStatus(
  userId: string,
  id: string,
  status: WatchlistStatus,
): Promise<boolean> {
  try {
    const sql = await db();
    try {
      const result = await sql`
        UPDATE property_watchlist SET status = ${status}, updated_at = now()
        WHERE id = ${id}::uuid AND user_id = ${userId}::uuid
      `;
      return result.count > 0;
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[watchlist] status update failed:", err);
    return false;
  }
}

export async function removeFromWatchlist(userId: string, id: string): Promise<boolean> {
  try {
    const sql = await db();
    try {
      const result = await sql`
        DELETE FROM property_watchlist WHERE id = ${id}::uuid AND user_id = ${userId}::uuid
      `;
      return result.count > 0;
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[watchlist] remove failed:", err);
    return false;
  }
}
