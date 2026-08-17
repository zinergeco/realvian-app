/**
 * SAVED COMPARISONS
 *
 * The `comparisons` table has existed since the original Phase 0 schema
 * with a nullable `user_id` FK to `users` — designed then, wired up now.
 * Nullable by design: /compare works fully for anonymous visitors, saving
 * is the one feature that requires an account.
 */

export interface SavedComparison {
  id: string;
  areaSlugs: [string, string];
  createdAt: string;
}

async function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  const { default: postgres } = await import("postgres");
  return postgres(url, { max: 3, idle_timeout: 20, connect_timeout: 10 });
}

/** Idempotent: saving the same pair twice updates the timestamp rather than duplicating. */
export async function saveComparison(
  userId: string,
  areaSlugA: string,
  areaSlugB: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const sql = await db();
    try {
      const slugs = [areaSlugA, areaSlugB].sort(); // order-independent de-dupe
      const existing = await sql<{ id: string }[]>`
        SELECT id FROM comparisons
        WHERE user_id = ${userId}::uuid AND area_slugs = ${JSON.stringify(slugs)}::jsonb
        LIMIT 1
      `;
      if (existing.length > 0) {
        await sql`UPDATE comparisons SET created_at = now() WHERE id = ${existing[0]!.id}::uuid`;
        return { ok: true };
      }
      await sql`
        INSERT INTO comparisons (user_id, area_slugs)
        VALUES (${userId}::uuid, ${JSON.stringify(slugs)}::jsonb)
      `;
      return { ok: true };
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[comparisons] save failed:", err);
    return { ok: false, error: "Could not save this comparison." };
  }
}

export async function listUserComparisons(userId: string): Promise<SavedComparison[]> {
  try {
    const sql = await db();
    try {
      const rows = await sql<{ id: string; area_slugs: string[]; created_at: Date }[]>`
        SELECT id, area_slugs, created_at FROM comparisons
        WHERE user_id = ${userId}::uuid
        ORDER BY created_at DESC
        LIMIT 50
      `;
      return rows
        .filter((r) => Array.isArray(r.area_slugs) && r.area_slugs.length === 2)
        .map((r) => ({
          id: r.id,
          areaSlugs: [r.area_slugs[0]!, r.area_slugs[1]!],
          createdAt: r.created_at.toISOString(),
        }));
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[comparisons] list failed:", err);
    return [];
  }
}

/** Ownership is enforced in the query itself, not checked separately — a user can never delete a row that isn't theirs, by construction. */
export async function deleteComparison(userId: string, comparisonId: string): Promise<boolean> {
  try {
    const sql = await db();
    try {
      const result = await sql`
        DELETE FROM comparisons WHERE id = ${comparisonId}::uuid AND user_id = ${userId}::uuid
      `;
      return result.count > 0;
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[comparisons] delete failed:", err);
    return false;
  }
}

/** Whether this exact pair is already saved by this user — drives the button's initial state. */
export async function isComparisonSaved(
  userId: string,
  areaSlugA: string,
  areaSlugB: string,
): Promise<boolean> {
  try {
    const sql = await db();
    try {
      const slugs = [areaSlugA, areaSlugB].sort();
      const rows = await sql<{ id: string }[]>`
        SELECT id FROM comparisons
        WHERE user_id = ${userId}::uuid AND area_slugs = ${JSON.stringify(slugs)}::jsonb
        LIMIT 1
      `;
      return rows.length > 0;
    } finally {
      await sql.end();
    }
  } catch {
    return false;
  }
}
