/**
 * API KEYS — free, self-serve, no billing gate.
 *
 * Security model: the raw key is generated with crypto.randomBytes,
 * shown to the user exactly once, and only its SHA-256 hash is ever
 * stored or compared against. A stolen database dump doesn't hand
 * over usable keys. SHA-256 (not bcrypt/argon2) is the right choice
 * here specifically because these are high-entropy random tokens, not
 * human-chosen passwords — there's no dictionary attack to slow down.
 */

import { randomBytes, createHash } from "node:crypto";

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

async function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  const { default: postgres } = await import("postgres");
  return postgres(url, { max: 3, idle_timeout: 20, connect_timeout: 10 });
}

function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/** Returns the raw key ONCE — the only time it ever exists outside the caller's clipboard. */
export async function generateApiKey(
  userId: string,
  name: string,
): Promise<{ ok: true; rawKey: string } | { ok: false; error: string }> {
  const rawKey = `rv_${randomBytes(24).toString("hex")}`;
  const keyPrefix = rawKey.slice(0, 11); // "rv_" + 8 hex chars
  const keyHash = hashKey(rawKey);

  try {
    const sql = await db();
    try {
      await sql`
        INSERT INTO api_keys (user_id, name, key_hash, key_prefix)
        VALUES (${userId}::uuid, ${name}, ${keyHash}, ${keyPrefix})
      `;
      return { ok: true, rawKey };
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[api-keys] generate failed:", err);
    return { ok: false, error: "Could not generate a key. Please try again." };
  }
}

export async function listApiKeys(userId: string): Promise<ApiKey[]> {
  try {
    const sql = await db();
    try {
      const rows = await sql<Record<string, unknown>[]>`
        SELECT id, name, key_prefix, created_at, last_used_at
        FROM api_keys
        WHERE user_id = ${userId}::uuid AND revoked_at IS NULL
        ORDER BY created_at DESC
      `;
      return rows.map((r) => ({
        id: String(r.id),
        name: String(r.name),
        keyPrefix: String(r.key_prefix),
        createdAt: (r.created_at as Date).toISOString(),
        lastUsedAt: r.last_used_at ? (r.last_used_at as Date).toISOString() : null,
      }));
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[api-keys] list failed:", err);
    return [];
  }
}

export async function revokeApiKey(userId: string, keyId: string): Promise<boolean> {
  try {
    const sql = await db();
    try {
      const result = await sql`
        UPDATE api_keys SET revoked_at = now()
        WHERE id = ${keyId}::uuid AND user_id = ${userId}::uuid AND revoked_at IS NULL
      `;
      return result.count > 0;
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[api-keys] revoke failed:", err);
    return false;
  }
}

/**
 * Called on every API request that supplies a key. Returns whether
 * the key is valid — deliberately fails open to "invalid" rather than
 * throwing, since a DB hiccup here should degrade a caller to the
 * anonymous rate limit, not crash their request entirely.
 */
export async function validateApiKey(rawKey: string): Promise<boolean> {
  if (!rawKey.startsWith("rv_")) return false;

  try {
    const sql = await db();
    try {
      const keyHash = hashKey(rawKey);
      const rows = await sql<{ id: string }[]>`
        SELECT id FROM api_keys WHERE key_hash = ${keyHash} AND revoked_at IS NULL LIMIT 1
      `;
      if (rows.length === 0) return false;

      // Best-effort in spirit (a failed timestamp update shouldn't
      // fail the real request), but still awaited — firing it without
      // waiting would race against sql.end() in the finally block
      // below, which could cut the UPDATE off mid-flight.
      try {
        await sql`UPDATE api_keys SET last_used_at = now() WHERE id = ${rows[0]!.id}::uuid`;
      } catch {
        /* non-critical */
      }
      return true;
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[api-keys] validate failed:", err);
    return false;
  }
}
