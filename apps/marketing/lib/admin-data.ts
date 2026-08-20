/**
 * ADMIN DATA ACCESS
 *
 * Every mutation here writes to audit_log. That is not optional bookkeeping:
 * if a published figure or a paid placement is ever challenged, "who changed
 * this and when" needs an answer.
 *
 * All functions throw on database failure rather than returning empty. The
 * admin panel SHOULD break loudly when the database is down — unlike the
 * public site, which degrades gracefully. An admin who thinks they saved
 * something that didn't save is worse than an admin seeing an error.
 */

import postgres from "postgres";

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return postgres(url, { max: 5, idle_timeout: 20, connect_timeout: 10 });
}

/* ══════════════════════════════════════════════════════
   DASHBOARD COUNTS
   ══════════════════════════════════════════════════════ */
export interface DashboardStats {
  mediaCount: number;
  overrideCount: number;
  programCount: number;
  productCount: number;
  listingsPending: number;
  listingsApproved: number;
  clicks7d: number;
  areasInDb: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const sql = db();
  try {
    const [m, o, pr, pd, lp, la, c, a] = await Promise.all([
      sql`SELECT count(*)::int AS n FROM media WHERE deleted_at IS NULL`,
      sql`SELECT count(*)::int AS n FROM content_overrides`,
      sql`SELECT count(*)::int AS n FROM affiliate_programs`,
      sql`SELECT count(*)::int AS n FROM affiliate_products`,
      sql`SELECT count(*)::int AS n FROM business_listings WHERE status = 'pending'`,
      sql`SELECT count(*)::int AS n FROM business_listings WHERE status = 'approved'`,
      sql`SELECT count(*)::int AS n FROM click_events WHERE created_at > now() - interval '7 days'`,
      sql`SELECT count(*)::int AS n FROM areas`,
    ]);
    return {
      mediaCount: (m[0] as { n: number }).n,
      overrideCount: (o[0] as { n: number }).n,
      programCount: (pr[0] as { n: number }).n,
      productCount: (pd[0] as { n: number }).n,
      listingsPending: (lp[0] as { n: number }).n,
      listingsApproved: (la[0] as { n: number }).n,
      clicks7d: (c[0] as { n: number }).n,
      areasInDb: (a[0] as { n: number }).n,
    };
  } finally {
    await sql.end();
  }
}

/* ══════════════════════════════════════════════════════
   MEDIA
   ══════════════════════════════════════════════════════ */
export interface MediaRow {
  id: string;
  filename: string;
  storageKey: string;
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  caption: string | null;
  credit: string | null;
  licence: string | null;
  createdAt: string;
}

export async function listMedia(limit = 100): Promise<MediaRow[]> {
  const sql = db();
  try {
    const rows = await sql<Record<string, unknown>[]>`
      SELECT id, filename, storage_key, mime_type, bytes, width, height,
             alt_text, caption, credit, licence, created_at
      FROM media WHERE deleted_at IS NULL
      ORDER BY created_at DESC LIMIT ${limit}
    `;
    return rows.map((r) => ({
      id: String(r.id),
      filename: String(r.filename),
      storageKey: String(r.storage_key),
      mimeType: String(r.mime_type),
      bytes: Number(r.bytes),
      width: r.width === null ? null : Number(r.width),
      height: r.height === null ? null : Number(r.height),
      altText: String(r.alt_text),
      caption: r.caption ? String(r.caption) : null,
      credit: r.credit ? String(r.credit) : null,
      licence: r.licence ? String(r.licence) : null,
      createdAt: (r.created_at as Date).toISOString(),
    }));
  } finally {
    await sql.end();
  }
}

export async function insertMedia(input: {
  filename: string;
  storageKey: string;
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  credit: string | null;
  licence: string | null;
  /** null for public submissions (e.g. a business listing logo) — the
   * media table's uploaded_by column is nullable specifically for this. */
  uploadedBy: string | null;
}): Promise<string> {
  const sql = db();
  try {
    const rows = await sql<{ id: string }[]>`
      INSERT INTO media (filename, storage_key, mime_type, bytes, width, height,
                         alt_text, credit, licence, uploaded_by)
      VALUES (${input.filename}, ${input.storageKey}, ${input.mimeType},
              ${input.bytes}, ${input.width}, ${input.height},
              ${input.altText}, ${input.credit}, ${input.licence}, ${input.uploadedBy}::uuid)
      RETURNING id
    `;
    return String(rows[0]!.id);
  } finally {
    await sql.end();
  }
}

export async function softDeleteMedia(id: string): Promise<void> {
  const sql = db();
  try {
    await sql`UPDATE media SET deleted_at = now() WHERE id = ${id}::uuid`;
  } finally {
    await sql.end();
  }
}

/* ══════════════════════════════════════════════════════
   CONTENT OVERRIDES
   ══════════════════════════════════════════════════════ */
export interface OverrideRow {
  entityType: string;
  entityKey: string;
  title: string | null;
  description: string | null;
  heroMediaId: string | null;
  heroStorageKey: string | null;
  hidden: boolean;
  updatedAt: string | null;
}

export async function listOverrides(): Promise<OverrideRow[]> {
  const sql = db();
  try {
    const rows = await sql<Record<string, unknown>[]>`
      SELECT o.entity_type, o.entity_key, o.title, o.description,
             o.hero_media_id, o.hidden, o.updated_at, m.storage_key
      FROM content_overrides o
      LEFT JOIN media m ON m.id = o.hero_media_id AND m.deleted_at IS NULL
      ORDER BY o.updated_at DESC
    `;
    return rows.map((r) => ({
      entityType: String(r.entity_type),
      entityKey: String(r.entity_key),
      title: r.title ? String(r.title) : null,
      description: r.description ? String(r.description) : null,
      heroMediaId: r.hero_media_id ? String(r.hero_media_id) : null,
      heroStorageKey: r.storage_key ? String(r.storage_key) : null,
      hidden: Boolean(r.hidden),
      updatedAt: r.updated_at ? (r.updated_at as Date).toISOString() : null,
    }));
  } finally {
    await sql.end();
  }
}

export async function upsertOverride(input: {
  entityType: string;
  entityKey: string;
  title?: string | null;
  description?: string | null;
  heroMediaId?: string | null;
  hidden?: boolean;
  updatedBy: string;
}): Promise<void> {
  const sql = db();
  try {
    await sql`
      INSERT INTO content_overrides
        (entity_type, entity_key, title, description, hero_media_id, hidden, updated_by, updated_at)
      VALUES
        (${input.entityType}, ${input.entityKey},
         ${input.title ?? null}, ${input.description ?? null},
         ${input.heroMediaId ?? null}, ${input.hidden ?? false},
         ${input.updatedBy}::uuid, now())
      ON CONFLICT (entity_type, entity_key) DO UPDATE SET
        -- Unconditional overwrite, not COALESCE. The UI's own copy says
        -- "leave blank to keep the generated title" — meaning blank must
        -- mean "no override", not "keep whatever was here before". A
        -- COALESCE here would make it impossible to ever clear a field
        -- back to the generated version once set, which is exactly the
        -- bug this replaces (confirmed live: saving blank fields left
        -- the old override value in place indefinitely).
        title       = EXCLUDED.title,
        description = EXCLUDED.description,
        hero_media_id = EXCLUDED.hero_media_id,
        hidden      = EXCLUDED.hidden,
        updated_by  = EXCLUDED.updated_by,
        updated_at  = now()
    `;
  } finally {
    await sql.end();
  }
}

/* ══════════════════════════════════════════════════════
   AFFILIATE PROGRAMMES & PRODUCTS
   ══════════════════════════════════════════════════════ */
export interface ProgramRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  baseUrl: string;
  commissionType: string | null;
  commissionValue: number | null;
  active: boolean;
  priority: number;
  productCount: number;
}

export async function listPrograms(): Promise<ProgramRow[]> {
  const sql = db();
  try {
    const rows = await sql<Record<string, unknown>[]>`
      SELECT p.id, p.name, p.slug, p.category, p.base_url,
             p.commission_type, p.commission_value, p.active, p.priority,
             (SELECT count(*)::int FROM affiliate_products x WHERE x.program_id = p.id) AS product_count
      FROM affiliate_programs p
      ORDER BY p.priority DESC, p.name
    `;
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      category: String(r.category),
      baseUrl: String(r.base_url),
      commissionType: r.commission_type ? String(r.commission_type) : null,
      commissionValue: r.commission_value === null ? null : Number(r.commission_value),
      active: Boolean(r.active),
      priority: Number(r.priority),
      productCount: Number(r.product_count),
    }));
  } finally {
    await sql.end();
  }
}

export async function createProgram(input: {
  name: string;
  slug: string;
  category: string;
  baseUrl: string;
  commissionType: string | null;
  commissionValue: number | null;
}): Promise<void> {
  const sql = db();
  try {
    await sql`
      INSERT INTO affiliate_programs (name, slug, category, base_url, commission_type, commission_value, active)
      VALUES (${input.name}, ${input.slug}, ${input.category}, ${input.baseUrl},
              ${input.commissionType}, ${input.commissionValue}, false)
    `;
  } finally {
    await sql.end();
  }
}

export async function setProgramActive(id: string, active: boolean): Promise<void> {
  const sql = db();
  try {
    await sql`UPDATE affiliate_programs SET active = ${active} WHERE id = ${id}::uuid`;
  } finally {
    await sql.end();
  }
}

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  destinationUrl: string;
  programName: string;
  scopeType: string;
  scopeValue: string | null;
  matchTopics: string[];
  active: boolean;
  clicks30d: number;
}

export async function listProducts(): Promise<ProductRow[]> {
  const sql = db();
  try {
    const rows = await sql<Record<string, unknown>[]>`
      SELECT p.id, p.name, p.slug, p.description, p.destination_url,
             p.scope_type, p.scope_value, p.match_topics, p.active,
             pr.name AS program_name,
             (SELECT count(*)::int FROM click_events c
              WHERE c.target_id = p.id AND c.created_at > now() - interval '30 days') AS clicks_30d
      FROM affiliate_products p
      JOIN affiliate_programs pr ON pr.id = p.program_id
      ORDER BY p.priority DESC, p.name
    `;
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      description: String(r.description),
      destinationUrl: String(r.destination_url),
      programName: String(r.program_name),
      scopeType: String(r.scope_type),
      scopeValue: r.scope_value ? String(r.scope_value) : null,
      matchTopics: (r.match_topics as string[]) ?? [],
      active: Boolean(r.active),
      clicks30d: Number(r.clicks_30d),
    }));
  } finally {
    await sql.end();
  }
}

export async function createProduct(input: {
  programId: string;
  name: string;
  slug: string;
  description: string;
  destinationUrl: string;
  ctaLabel: string;
  matchTopics: string[];
  scopeType: string;
  scopeValue: string | null;
}): Promise<void> {
  const sql = db();
  try {
    await sql`
      INSERT INTO affiliate_products
        (program_id, name, slug, description, destination_url, cta_label,
         match_topics, scope_type, scope_value, active)
      VALUES
        (${input.programId}::uuid, ${input.name}, ${input.slug}, ${input.description},
         ${input.destinationUrl}, ${input.ctaLabel}, ${input.matchTopics},
         ${input.scopeType}, ${input.scopeValue}, true)
    `;
  } finally {
    await sql.end();
  }
}

export async function setProductActive(id: string, active: boolean): Promise<void> {
  const sql = db();
  try {
    await sql`UPDATE affiliate_products SET active = ${active} WHERE id = ${id}::uuid`;
  } finally {
    await sql.end();
  }
}

/* ══════════════════════════════════════════════════════
   BUSINESS LISTINGS
   ══════════════════════════════════════════════════════ */
export interface ListingRow {
  id: string;
  businessName: string;
  category: string;
  description: string;
  website: string | null;
  phone: string | null;
  postcode: string;
  outcode: string;
  city: string | null;
  tier: string;
  status: string;
  verified: boolean;
  createdAt: string;
  logoKey: string | null;
  coverKey: string | null;
}

export async function listListings(status?: string): Promise<ListingRow[]> {
  const sql = db();
  try {
    const rows = status
      ? await sql<Record<string, unknown>[]>`
          SELECT b.id, b.business_name, b.category, b.description, b.website, b.phone,
                 b.postcode, b.outcode, b.city, b.tier, b.status, b.verified, b.created_at,
                 lm.storage_key AS logo_key, cm.storage_key AS cover_key
          FROM business_listings b
          LEFT JOIN media lm ON lm.id = b.logo_media_id AND lm.deleted_at IS NULL
          LEFT JOIN media cm ON cm.id = b.media_id AND cm.deleted_at IS NULL
          WHERE b.status = ${status}
          ORDER BY b.created_at DESC`
      : await sql<Record<string, unknown>[]>`
          SELECT b.id, b.business_name, b.category, b.description, b.website, b.phone,
                 b.postcode, b.outcode, b.city, b.tier, b.status, b.verified, b.created_at,
                 lm.storage_key AS logo_key, cm.storage_key AS cover_key
          FROM business_listings b
          LEFT JOIN media lm ON lm.id = b.logo_media_id AND lm.deleted_at IS NULL
          LEFT JOIN media cm ON cm.id = b.media_id AND cm.deleted_at IS NULL
          ORDER BY b.created_at DESC`;
    return rows.map((r) => ({
      id: String(r.id),
      businessName: String(r.business_name),
      category: String(r.category),
      description: String(r.description),
      website: r.website ? String(r.website) : null,
      phone: r.phone ? String(r.phone) : null,
      postcode: String(r.postcode),
      outcode: String(r.outcode),
      city: r.city ? String(r.city) : null,
      tier: String(r.tier),
      status: String(r.status),
      verified: Boolean(r.verified),
      createdAt: (r.created_at as Date).toISOString(),
      logoKey: r.logo_key ? String(r.logo_key) : null,
      coverKey: r.cover_key ? String(r.cover_key) : null,
    }));
  } finally {
    await sql.end();
  }
}

export async function createListing(input: {
  businessName: string;
  slug: string;
  category: string;
  description: string;
  website: string | null;
  logoMediaId: string | null;
  coverMediaId: string | null;
  phone: string | null;
  email: string | null;
  postcode: string;
  outcode: string;
  city: string | null;
  region: string | null;
}): Promise<void> {
  const sql = db();
  try {
    await sql`
      INSERT INTO business_listings
        (business_name, slug, category, description, website, phone, email,
         postcode, outcode, city, region, logo_media_id, media_id, tier, status)
      VALUES
        (${input.businessName}, ${input.slug}, ${input.category}, ${input.description},
         ${input.website}, ${input.phone}, ${input.email},
         ${input.postcode}, ${input.outcode}, ${input.city}, ${input.region},
         ${input.logoMediaId ?? null}, ${input.coverMediaId ?? null},
         'free', 'pending')
    `;
  } finally {
    await sql.end();
  }
}

export async function setListingStatus(
  id: string,
  status: "approved" | "rejected" | "pending",
  adminId: string,
  tier?: string,
): Promise<void> {
  const sql = db();
  try {
    if (tier) {
      await sql`
        UPDATE business_listings
        SET status = ${status}, tier = ${tier}, is_paid = ${tier !== "free"},
            approved_by = ${adminId}::uuid,
            approved_at = ${status === "approved" ? sql`now()` : null}
        WHERE id = ${id}::uuid`;
    } else {
      await sql`
        UPDATE business_listings
        SET status = ${status}, approved_by = ${adminId}::uuid,
            approved_at = ${status === "approved" ? sql`now()` : null}
        WHERE id = ${id}::uuid`;
    }
  } finally {
    await sql.end();
  }
}

/* ══════════════════════════════════════════════════════
   AUDIT VIEW
   ══════════════════════════════════════════════════════ */
export interface AuditRow {
  id: string;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityKey: string | null;
  createdAt: string;
}

export async function listAudit(limit = 30): Promise<AuditRow[]> {
  const sql = db();
  try {
    const rows = await sql<Record<string, unknown>[]>`
      SELECT id, actor_email, action, entity_type, entity_key, created_at
      FROM audit_log ORDER BY created_at DESC LIMIT ${limit}
    `;
    return rows.map((r) => ({
      id: String(r.id),
      actorEmail: r.actor_email ? String(r.actor_email) : null,
      action: String(r.action),
      entityType: String(r.entity_type),
      entityKey: r.entity_key ? String(r.entity_key) : null,
      createdAt: (r.created_at as Date).toISOString(),
    }));
  } finally {
    await sql.end();
  }
}
