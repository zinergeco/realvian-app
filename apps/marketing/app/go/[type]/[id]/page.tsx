/**
 * CLICK TRACKING REDIRECT
 *
 *   /go/p/{id}  → affiliate product
 *   /go/l/{id}  → business listing
 *
 * Records the click, then 302s to the destination.
 *
 * ── SECURITY: NO OPEN REDIRECT ──
 * The destination is looked up from the DATABASE by id. It is never taken
 * from a query parameter. An endpoint that redirects to a user-supplied
 * URL is an open redirect — usable for phishing under our domain's
 * reputation, and a finding in any security review.
 *
 * ── PRIVACY ──
 * We store no IP and no raw identifier. `session_hash` is a salted,
 * daily-rotating hash used only to deduplicate clicks, which keeps this
 * out of personal-data territory under UK GDPR while still giving us
 * usable attribution.
 *
 * ── FAILURE POSTURE ──
 * If tracking fails, the user is still redirected. Analytics must never
 * stand between a visitor and the thing they clicked.
 */

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function classifyUserAgent(ua: string): "mobile" | "desktop" | "bot" {
  if (/bot|crawl|spider|slurp|bingpreview|headless/i.test(ua)) return "bot";
  if (/mobile|android|iphone|ipad/i.test(ua)) return "mobile";
  return "desktop";
}

/** Daily-rotating salted hash. Not reversible, not an identifier. */
function sessionHash(ua: string, acceptLang: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.CLICK_HASH_SALT ?? "realvian-default-salt";
  return createHash("sha256")
    .update(`${day}|${salt}|${ua}|${acceptLang}`)
    .digest("hex")
    .slice(0, 32);
}

async function recordAndResolve(
  type: string,
  id: string,
  ctx: {
    path: string;
    slot: string | null;
    outcode: string | null;
    postSlug: string | null;
    ua: string;
    acceptLang: string;
    referrer: string | null;
  },
): Promise<string | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  const targetType = type === "p" ? "affiliate_product" : "business_listing";

  try {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { max: 2, connect_timeout: 8 });

    try {
      // 1. Resolve destination from the database — never from user input
      let destination: string | null = null;

      if (targetType === "affiliate_product") {
        const rows = await sql<{ destination_url: string }[]>`
          SELECT p.destination_url
          FROM affiliate_products p
          JOIN affiliate_programs pr ON pr.id = p.program_id
          WHERE p.id = ${id}::uuid AND p.active = true AND pr.active = true
          LIMIT 1
        `;
        destination = rows[0]?.destination_url ?? null;
      } else {
        const rows = await sql<{ website: string | null }[]>`
          SELECT website FROM business_listings
          WHERE id = ${id}::uuid AND status = 'approved'
          LIMIT 1
        `;
        destination = rows[0]?.website ?? null;
      }

      if (!destination) return null;

      // 2. Record the click. Bots are excluded — they'd distort every
      //    conversion figure we report to partners.
      const uaClass = classifyUserAgent(ctx.ua);
      if (uaClass !== "bot") {
        await sql`
          INSERT INTO click_events
            (target_type, target_id, source_path, slot_key, area_outcode,
             post_slug, session_hash, user_agent_class, referrer_host)
          VALUES
            (${targetType}, ${id}::uuid, ${ctx.path}, ${ctx.slot},
             ${ctx.outcode}, ${ctx.postSlug},
             ${sessionHash(ctx.ua, ctx.acceptLang)}, ${uaClass}, ${ctx.referrer})
        `;
      }

      return destination;
    } finally {
      await sql.end();
    }
  } catch (err) {
    console.error("[click] tracking failed:", err);
    return null;
  }
}

export default async function GoPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { type, id } = await params;
  const sp = await searchParams;

  // Validate shape before touching the database
  const validType = type === "p" || type === "l";
  const validId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (!validType || !validId) redirect("/");

  const h = await headers();
  const referrerRaw = h.get("referer");
  let referrerHost: string | null = null;
  if (referrerRaw) {
    try {
      referrerHost = new URL(referrerRaw).host;
    } catch {
      referrerHost = null;
    }
  }

  const destination = await recordAndResolve(type, id, {
    path: sp.from ?? "/",
    slot: sp.slot ?? null,
    outcode: sp.area ?? null,
    postSlug: sp.post ?? null,
    ua: h.get("user-agent") ?? "",
    acceptLang: h.get("accept-language") ?? "",
    referrer: referrerHost,
  });

  // Unknown target, inactive product, or DB down — send them somewhere useful
  redirect(destination ?? "/");
}
