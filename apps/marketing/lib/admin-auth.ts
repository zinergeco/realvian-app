/**
 * ADMIN AUTHENTICATION
 *
 * Deliberately minimal and self-hosted. No third-party auth provider for
 * the admin surface — it is a small, fixed set of staff accounts and
 * adding an external dependency to the highest-privilege surface on the
 * platform buys nothing.
 *
 * ── SECURITY PROPERTIES ──
 *   • Passwords: scrypt with a per-user random salt. Never bcrypt-via-npm
 *     here because Node ships scrypt natively — one less dependency in the
 *     auth path.
 *   • Sessions: 256-bit random ID, stored server-side, HttpOnly + Secure +
 *     SameSite=Strict cookie. The cookie holds only the ID; revoking a
 *     session means deleting the row, which takes effect immediately.
 *   • Timing: comparisons use timingSafeEqual. Login failures take the
 *     same time whether the email exists or not, so the endpoint cannot
 *     be used to enumerate accounts.
 *   • Every login attempt is written to audit_log, success or failure.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ──
 * No password reset by email. With a handful of staff accounts, a reset
 * flow is more attack surface than it is worth — an admin resets another
 * admin via CLI. Revisit if the team passes ~10 people.
 */

import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";

const scrypt = promisify(_scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const SESSION_COOKIE = "rv_admin_session";
const SESSION_TTL_HOURS = 12;
const KEY_LENGTH = 64;

/* ══════════════════════════════════════════════════════
   PASSWORD HASHING
   ══════════════════════════════════════════════════════ */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = parts[1]!;
  const expected = Buffer.from(parts[2]!, "hex");
  const derived = await scrypt(password, salt, KEY_LENGTH);
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

/* ══════════════════════════════════════════════════════
   SESSION
   ══════════════════════════════════════════════════════ */
export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: "editor" | "admin";
}

async function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  const { default: postgres } = await import("postgres");
  return postgres(url, { max: 3, idle_timeout: 20, connect_timeout: 10 });
}

export async function createSession(
  userId: string,
  meta: { ip?: string; userAgent?: string } = {},
): Promise<string> {
  const sql = await db();
  try {
    const id = randomBytes(32).toString("base64url");
    const expires = new Date(Date.now() + SESSION_TTL_HOURS * 3_600_000);
    await sql`
      INSERT INTO admin_sessions (id, user_id, expires_at, ip_address, user_agent)
      VALUES (${id}, ${userId}, ${expires}, ${meta.ip ?? null}, ${meta.userAgent ?? null})
    `;
    await sql`UPDATE admin_users SET last_login_at = now() WHERE id = ${userId}`;
    return id;
  } finally {
    await sql.end();
  }
}

/** Resolves the current admin from the session cookie, or null. */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  try {
    const sql = await db();
    try {
      const rows = await sql<
        { id: string; email: string; name: string | null; role: string }[]
      >`
        SELECT u.id, u.email, u.name, u.role
        FROM admin_sessions s
        JOIN admin_users u ON u.id = s.user_id
        WHERE s.id = ${sessionId}
          AND s.expires_at > now()
          AND u.disabled_at IS NULL
        LIMIT 1
      `;
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role === "admin" ? "admin" : "editor",
      };
    } finally {
      await sql.end();
    }
  } catch {
    // Database down — deny admin access rather than fail open.
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    try {
      const sql = await db();
      await sql`DELETE FROM admin_sessions WHERE id = ${sessionId}`;
      await sql.end();
    } catch {
      /* best effort — cookie is cleared regardless */
    }
  }
  store.delete(SESSION_COOKIE);
}

/* ══════════════════════════════════════════════════════
   LOGIN
   ══════════════════════════════════════════════════════ */
export interface LoginResult {
  ok: boolean;
  error?: string;
  sessionId?: string;
}

/**
 * Authenticates and creates a session.
 *
 * Runs a dummy hash comparison when the email is unknown so response time
 * does not reveal whether an account exists.
 */
export async function login(
  email: string,
  password: string,
  meta: { ip?: string; userAgent?: string } = {},
): Promise<LoginResult> {
  const DUMMY =
    "scrypt$0000000000000000000000000000000000000000000000000000000000000000$" +
    "0".repeat(128);

  let sql;
  try {
    sql = await db();
  } catch {
    return { ok: false, error: "Authentication is unavailable right now." };
  }

  try {
    const rows = await sql<
      { id: string; password_hash: string; disabled_at: Date | null }[]
    >`
      SELECT id, password_hash, disabled_at
      FROM admin_users
      WHERE lower(email) = lower(${email})
      LIMIT 1
    `;

    const user = rows[0];
    const valid = await verifyPassword(password, user?.password_hash ?? DUMMY);

    if (!user || !valid || user.disabled_at) {
      await sql`
        INSERT INTO audit_log (actor_email, action, entity_type, ip_address)
        VALUES (${email}, 'login_failed', 'admin_user', ${meta.ip ?? null})
      `;
      // Identical message for every failure mode
      return { ok: false, error: "Email or password is incorrect." };
    }

    const sessionId = await createSession(user.id, meta);
    await sql`
      INSERT INTO audit_log (actor_id, actor_email, action, entity_type, ip_address)
      VALUES (${user.id}, ${email}, 'login', 'admin_user', ${meta.ip ?? null})
    `;
    return { ok: true, sessionId };
  } catch (err) {
    console.error("[admin auth] login error:", err);
    return { ok: false, error: "Authentication is unavailable right now." };
  } finally {
    await sql.end();
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/admin",
  maxAge: SESSION_TTL_HOURS * 3600,
};

/* ══════════════════════════════════════════════════════
   AUDIT
   ══════════════════════════════════════════════════════ */
export async function audit(entry: {
  actorId?: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityKey?: string;
  diff?: Record<string, [unknown, unknown]>;
  ip?: string;
}): Promise<void> {
  try {
    const sql = await db();
    await sql`
      INSERT INTO audit_log
        (actor_id, actor_email, action, entity_type, entity_key, diff, ip_address)
      VALUES (
        ${entry.actorId ?? null}, ${entry.actorEmail ?? null}, ${entry.action},
        ${entry.entityType}, ${entry.entityKey ?? null},
        ${entry.diff ? JSON.stringify(entry.diff) : null}, ${entry.ip ?? null}
      )
    `;
    await sql.end();
  } catch (err) {
    // Never let audit failure block the action, but do surface it.
    console.error("[audit] write failed:", err);
  }
}
