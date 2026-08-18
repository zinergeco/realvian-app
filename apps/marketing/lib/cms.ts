/**
 * CMS CONTENT LAYER
 *
 * Merges editorial overrides from the database on top of generated content.
 *
 * ── THE CENTRAL DESIGN DECISION ──
 * Generated content is the base; the CMS stores only DIFFS. So:
 *   • Edit a headline → your headline survives every future data refresh
 *   • Don't edit the figures → they keep updating automatically
 *   • Attach an image → it persists independently of the generated body
 *
 * Storing whole posts in the CMS would defeat the programmatic engine —
 * you'd have 33 hand-maintained pages going stale instead of 33
 * self-updating ones.
 *
 * ── FAILURE MODE ──
 * If the database is unreachable, every function here returns the
 * generated content unchanged. The public site must never go down because
 * the CMS is down. Overrides are an enhancement, not a dependency.
 */

import type { BlogPost, PostSection } from "./blog";

/* ══════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════ */
export interface MediaItem {
  id: string;
  storageKey: string;
  altText: string;
  caption: string | null;
  credit: string | null;
  licence: string | null;
  width: number | null;
  height: number | null;
  focalX: number;
  focalY: number;
}

export interface ContentOverride {
  entityType: "post" | "area" | "page";
  entityKey: string;
  title: string | null;
  description: string | null;
  excerpt: string | null;
  /** Keyed by section heading → replacement paragraphs */
  sections: Record<string, string[]> | null;
  heroMedia: MediaItem | null;
  bodyMedia: { media: MediaItem; afterSection: string; size: "full" | "half" }[];
  hidden: boolean;
  noindex: boolean;
  updatedAt: string;
}

/** A post after overrides are applied */
export interface ResolvedPost extends BlogPost {
  heroMedia: MediaItem | null;
  bodyMedia: { media: MediaItem; afterSection: string; size: "full" | "half" }[];
  hidden: boolean;
  noindex: boolean;
  /** Which fields an editor has changed — shown in the admin UI */
  overriddenFields: string[];
}

/* ══════════════════════════════════════════════════════
   PUBLIC IMAGE URL
   ══════════════════════════════════════════════════════ */
export function mediaUrl(m: MediaItem, width?: number): string {
  const base = `/media/${m.storageKey}`;
  return width ? `${base}?w=${width}` : base;
}

/** CSS object-position from the stored focal point — keeps faces in frame on crop */
export function focalStyle(m: MediaItem): { objectPosition: string } {
  return { objectPosition: `${m.focalX * 100}% ${m.focalY * 100}%` };
}

/* ══════════════════════════════════════════════════════
   MERGE
   ══════════════════════════════════════════════════════ */
export function applyOverride(
  post: BlogPost,
  override: ContentOverride | null,
): ResolvedPost {
  if (!override) {
    return {
      ...post,
      heroMedia: null,
      bodyMedia: [],
      hidden: false,
      noindex: false,
      overriddenFields: [],
    };
  }

  const changed: string[] = [];
  if (override.title) changed.push("title");
  if (override.description) changed.push("description");
  if (override.excerpt) changed.push("excerpt");
  if (override.heroMedia) changed.push("heroMedia");

  // Section-level merge: replace paragraphs only for headings the editor touched
  let sections: PostSection[] = post.sections;
  if (override.sections) {
    const overrides = override.sections;
    sections = post.sections.map((s) => {
      const replacement = overrides[s.heading];
      if (!replacement) return s;
      changed.push(`section:${s.heading}`);
      // Tables and stats stay generated — an editor overrides prose, not data.
      // Letting someone hand-edit a figure would break the audit trail that
      // makes every number on this site defensible.
      return { ...s, paragraphs: replacement };
    });
  }

  return {
    ...post,
    title: override.title ?? post.title,
    description: override.description ?? post.description,
    excerpt: override.excerpt ?? post.excerpt,
    sections,
    heroMedia: override.heroMedia,
    bodyMedia: override.bodyMedia,
    hidden: override.hidden,
    noindex: override.noindex,
    overriddenFields: changed,
  };
}

/* ══════════════════════════════════════════════════════
   DATA ACCESS
   Wired to Postgres when DATABASE_URL is present; returns empty
   otherwise so local development and builds work without a database.
   ══════════════════════════════════════════════════════ */

let overrideCache: Map<string, ContentOverride> | null = null;

export async function loadOverrides(): Promise<Map<string, ContentOverride>> {
  if (overrideCache) return overrideCache;

  const url = process.env.DATABASE_URL;
  if (!url) {
    // No database configured — pure generated output. This is the correct
    // behaviour for local dev and for CI builds, not an error.
    overrideCache = new Map();
    return overrideCache;
  }

  try {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { max: 2, idle_timeout: 20, connect_timeout: 10 });

    const rows = await sql<
      {
        entity_type: string;
        entity_key: string;
        title: string | null;
        description: string | null;
        excerpt: string | null;
        sections: Record<string, string[]> | null;
        hidden: boolean;
        noindex: boolean;
        updated_at: Date;
        media_id: string | null;
        storage_key: string | null;
        alt_text: string | null;
        caption: string | null;
        credit: string | null;
        licence: string | null;
        width: number | null;
        height: number | null;
        focal_x: string | null;
        focal_y: string | null;
      }[]
    >`
      SELECT o.entity_type, o.entity_key, o.title, o.description, o.excerpt,
             o.sections, o.hidden, o.noindex, o.updated_at,
             m.id AS media_id, m.storage_key, m.alt_text, m.caption,
             m.credit, m.licence, m.width, m.height, m.focal_x, m.focal_y
      FROM content_overrides o
      LEFT JOIN media m ON m.id = o.hero_media_id AND m.deleted_at IS NULL
    `;

    const map = new Map<string, ContentOverride>();
    for (const r of rows) {
      map.set(`${r.entity_type}:${r.entity_key}`, {
        entityType: r.entity_type as ContentOverride["entityType"],
        entityKey: r.entity_key,
        title: r.title,
        description: r.description,
        excerpt: r.excerpt,
        // r.sections is jsonb — confirmed via direct reproduction that this
        // driver returns jsonb columns as raw JSON text, not auto-parsed.
        // See lib/comparisons.ts for the original diagnosis of this pattern.
        sections:
          typeof r.sections === "string"
            ? (JSON.parse(r.sections) as Record<string, string[]>)
            : r.sections,
        heroMedia:
          r.media_id && r.storage_key
            ? {
                id: r.media_id,
                storageKey: r.storage_key,
                altText: r.alt_text ?? "",
                caption: r.caption,
                credit: r.credit,
                licence: r.licence,
                width: r.width,
                height: r.height,
                focalX: Number(r.focal_x ?? 0.5),
                focalY: Number(r.focal_y ?? 0.5),
              }
            : null,
        bodyMedia: [],
        hidden: r.hidden,
        noindex: r.noindex,
        updatedAt: r.updated_at.toISOString(),
      });
    }

    await sql.end();
    overrideCache = map;
    return map;
  } catch (err) {
    // Database unreachable — log and serve generated content.
    // The public site must not depend on the CMS being up.
    console.error(
      "[cms] override load failed, serving generated content:",
      err instanceof Error ? err.message : err,
    );
    overrideCache = new Map();
    return overrideCache;
  }
}

export async function getOverride(
  entityType: ContentOverride["entityType"],
  entityKey: string,
): Promise<ContentOverride | null> {
  const map = await loadOverrides();
  return map.get(`${entityType}:${entityKey}`) ?? null;
}

/** Site-wide settings, editable without a deploy */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const url = process.env.DATABASE_URL;
  if (!url) return fallback;
  try {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { max: 1, connect_timeout: 8 });
    const rows = await sql<{ value: unknown }[]>`
      SELECT value FROM site_settings WHERE key = ${key}
    `;
    await sql.end();
    const raw = rows[0]?.value;
    if (raw === undefined) return fallback;
    // Same jsonb-as-string driver behavior as elsewhere in this file.
    return (typeof raw === "string" ? (JSON.parse(raw) as T) : (raw as T));
  } catch {
    return fallback;
  }
}
