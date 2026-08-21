/**
 * FOLLOWED AREAS — bookmark/track, not notify
 *
 * See migration 0005 for why this deliberately doesn't send anything.
 */

export interface FollowedArea {
  id: string;
  areaSlug: string;
  createdAt: string;
}

async function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  const { default: postgres } = await import("postgres");
  return postgres(url, { max: 3, idle_timeout: 20, connect_timeout: 10 });
}

export async function followArea(
  userId: string,
  areaSlug: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const sql = await db();
    try {
      await sql`
        INSERT INTO followed_areas (user_id, area_slug)
        VALUES (${userId}::uuid, ${areaSlug})
        ON CONFLICT (user_id, area_slug) DO NOTHING
      `;
      return { ok: true };
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[followed-areas] follow failed:", err);
    return { ok: false, error: "Could not follow this area." };
  }
}

/** Ownership enforced in the query itself, same pattern as comparisons and properties. */
export async function unfollowArea(userId: string, areaSlug: string): Promise<boolean> {
  try {
    const sql = await db();
    try {
      const result = await sql`
        DELETE FROM followed_areas WHERE user_id = ${userId}::uuid AND area_slug = ${areaSlug}
      `;
      return result.count > 0;
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[followed-areas] unfollow failed:", err);
    return false;
  }
}

export async function listFollowedAreas(userId: string): Promise<FollowedArea[]> {
  try {
    const sql = await db();
    try {
      const rows = await sql<{ id: string; area_slug: string; created_at: Date }[]>`
        SELECT id, area_slug, created_at FROM followed_areas
        WHERE user_id = ${userId}::uuid
        ORDER BY created_at DESC
        LIMIT 100
      `;
      return rows.map((r) => ({
        id: r.id,
        areaSlug: r.area_slug,
        createdAt: r.created_at.toISOString(),
      }));
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[followed-areas] list failed:", err);
    return [];
  }
}

export async function isAreaFollowed(userId: string, areaSlug: string): Promise<boolean> {
  try {
    const sql = await db();
    try {
      const rows = await sql<{ id: string }[]>`
        SELECT id FROM followed_areas WHERE user_id = ${userId}::uuid AND area_slug = ${areaSlug} LIMIT 1
      `;
      return rows.length > 0;
    } finally {
      await sql.end();
    }
  } catch {
    return false;
  }
}
