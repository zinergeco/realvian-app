/**
 * LANDLORD PROPERTY COMPLIANCE TRACKING
 */

import { toOutcode, resolveGeography } from "./monetisation";
import { getAllAreas } from "./areas";
import { compareRentToArea, type RentComparison } from "./rent-comparison";

// Re-exported so existing server-side imports of these from this file
// keep working — client components should import from
// rent-comparison.ts directly instead, to avoid pulling in postgres.
export { compareRentToArea, type RentComparison };

export interface Property {
  id: string;
  nickname: string;
  postcode: string;
  outcode: string | null;
  city: string | null;
  epcRating: string | null;
  epcExpiry: string | null; // ISO date
  gasSafetyExpiry: string | null;
  eicrExpiry: string | null;
  currentRent: number | null; // £/month, self-reported by the landlord
  notes: string | null;
  createdAt: string;
}

export type UrgencyLevel = "overdue" | "urgent" | "ok" | "unknown";

export interface PropertyWithUrgency extends Property {
  /** The single earliest deadline across all three compliance dates, or null if none set */
  nextDeadline: { label: string; date: string } | null;
  urgency: UrgencyLevel;
}

const URGENT_WINDOW_DAYS = 60;

/**
 * Computes the most urgent upcoming deadline for a property and classifies it.
 *
 * Deliberately looks at the EARLIEST of the three dates, not each one
 * separately — a landlord needs one clear "what do I need to act on next"
 * signal per property, not three numbers to mentally compare every time.
 */
export function computeUrgency(p: Property): PropertyWithUrgency {
  const deadlines: { label: string; date: string }[] = [
    p.epcExpiry ? { label: "EPC", date: p.epcExpiry } : null,
    p.gasSafetyExpiry ? { label: "Gas safety", date: p.gasSafetyExpiry } : null,
    p.eicrExpiry ? { label: "EICR", date: p.eicrExpiry } : null,
  ].filter((d): d is { label: string; date: string } => d !== null);

  if (deadlines.length === 0) {
    return { ...p, nextDeadline: null, urgency: "unknown" };
  }

  deadlines.sort((a, b) => a.date.localeCompare(b.date));
  const next = deadlines[0]!;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(next.date);
  const daysUntil = Math.round((deadlineDate.getTime() - today.getTime()) / 86_400_000);

  const urgency: UrgencyLevel =
    daysUntil < 0 ? "overdue" : daysUntil <= URGENT_WINDOW_DAYS ? "urgent" : "ok";

  return { ...p, nextDeadline: next, urgency };
}

/** Sort order: overdue first, then soonest urgent, then ok, then unknown last. */
const URGENCY_RANK: Record<UrgencyLevel, number> = {
  overdue: 0,
  urgent: 1,
  ok: 2,
  unknown: 3,
};

export function sortByUrgency(properties: PropertyWithUrgency[]): PropertyWithUrgency[] {
  return [...properties].sort((a, b) => {
    const rankDiff = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
    if (rankDiff !== 0) return rankDiff;
    if (a.nextDeadline && b.nextDeadline) {
      return a.nextDeadline.date.localeCompare(b.nextDeadline.date);
    }
    return 0;
  });
}

/* ══════════════════════════════════════════════════════
   DATA ACCESS
   ══════════════════════════════════════════════════════ */
async function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  const { default: postgres } = await import("postgres");
  return postgres(url, { max: 3, idle_timeout: 20, connect_timeout: 10 });
}

function parseDbProperty(r: Record<string, unknown>): Property {
  return {
    id: String(r.id),
    nickname: String(r.nickname),
    postcode: String(r.postcode),
    outcode: r.outcode ? String(r.outcode) : null,
    city: r.city ? String(r.city) : null,
    epcRating: r.epc_rating ? String(r.epc_rating) : null,
    epcExpiry: r.epc_expiry ? new Date(r.epc_expiry as string).toISOString().slice(0, 10) : null,
    gasSafetyExpiry: r.gas_safety_expiry
      ? new Date(r.gas_safety_expiry as string).toISOString().slice(0, 10)
      : null,
    eicrExpiry: r.eicr_expiry ? new Date(r.eicr_expiry as string).toISOString().slice(0, 10) : null,
    currentRent: r.current_rent !== null && r.current_rent !== undefined ? Number(r.current_rent) : null,
    notes: r.notes ? String(r.notes) : null,
    createdAt: (r.created_at as Date).toISOString(),
  };
}

export async function listProperties(userId: string): Promise<Property[]> {
  try {
    const sql = await db();
    try {
      const rows = await sql<Record<string, unknown>[]>`
        SELECT id, nickname, postcode, outcode, city, epc_rating, epc_expiry,
               gas_safety_expiry, eicr_expiry, current_rent, notes, created_at
        FROM properties
        WHERE user_id = ${userId}::uuid
        ORDER BY created_at DESC
      `;
      return rows.map(parseDbProperty);
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[properties] list failed:", err);
    return [];
  }
}

export interface AddPropertyInput {
  nickname: string;
  postcode: string;
  epcRating: string | null;
  epcExpiry: string | null;
  gasSafetyExpiry: string | null;
  eicrExpiry: string | null;
  currentRent: number | null;
  notes: string | null;
}

export async function addProperty(
  userId: string,
  input: AddPropertyInput,
): Promise<{ ok: boolean; error?: string }> {
  const outcode = toOutcode(input.postcode);
  if (!outcode) return { ok: false, error: "That doesn't look like a valid UK postcode." };

  const geo = resolveGeography(input.postcode, getAllAreas());

  try {
    const sql = await db();
    try {
      await sql`
        INSERT INTO properties
          (user_id, nickname, postcode, outcode, city, region,
           epc_rating, epc_expiry, gas_safety_expiry, eicr_expiry, current_rent, notes)
        VALUES
          (${userId}::uuid, ${input.nickname}, ${input.postcode.toUpperCase()}, ${outcode},
           ${geo?.city ?? null}, ${geo?.region ?? null},
           ${input.epcRating}, ${input.epcExpiry}, ${input.gasSafetyExpiry}, ${input.eicrExpiry},
           ${input.currentRent}, ${input.notes})
      `;
      return { ok: true };
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[properties] add failed:", err);
    return { ok: false, error: "Could not save this property." };
  }
}

/** Ownership enforced in the query itself — same pattern as comparisons and admin data. */
export async function updatePropertyDates(
  userId: string,
  propertyId: string,
  input: Pick<AddPropertyInput, "epcRating" | "epcExpiry" | "gasSafetyExpiry" | "eicrExpiry" | "currentRent">,
): Promise<boolean> {
  try {
    const sql = await db();
    try {
      const result = await sql`
        UPDATE properties SET
          epc_rating = ${input.epcRating},
          epc_expiry = ${input.epcExpiry},
          gas_safety_expiry = ${input.gasSafetyExpiry},
          eicr_expiry = ${input.eicrExpiry},
          current_rent = ${input.currentRent},
          updated_at = now()
        WHERE id = ${propertyId}::uuid AND user_id = ${userId}::uuid
      `;
      return result.count > 0;
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[properties] update failed:", err);
    return false;
  }
}

export async function deleteProperty(userId: string, propertyId: string): Promise<boolean> {
  try {
    const sql = await db();
    try {
      const result = await sql`
        DELETE FROM properties WHERE id = ${propertyId}::uuid AND user_id = ${userId}::uuid
      `;
      return result.count > 0;
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[properties] delete failed:", err);
    return false;
  }
}
