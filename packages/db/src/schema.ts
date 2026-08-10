/**
 * REALVIAN DATABASE SCHEMA — Phase 0
 *
 * Only the entities Phase 0 and Phase 1 need. Expand per phase; do not
 * build the full model up front (BUILD_SPEC Section 8).
 *
 * Two decisions here are deliberately hard to change later, so they are
 * correct from the first migration:
 *
 *  1. `userRoles` is a JOIN TABLE, not an enum column on `users`.
 *     A landlord who is also an investor is a normal case, and
 *     retrofitting multi-role onto a single enum is painful.
 *
 *  2. `areas` carries PostGIS geometry from day one. The comparison
 *     engine, heatmaps and isochrone tools all build on it.
 */

import {
  pgTable,
  text,
  uuid,
  integer,
  numeric,
  timestamp,
  boolean,
  jsonb,
  primaryKey,
  index,
  pgEnum,
  customType,
} from "drizzle-orm/pg-core";

/* ── PostGIS custom types ─────────────────────────── */
const geographyPoint = customType<{ data: string }>({
  dataType: () => "geography(Point, 4326)",
});

const geographyPolygon = customType<{ data: string }>({
  dataType: () => "geography(MultiPolygon, 4326)",
});

/* ── Enums ────────────────────────────────────────── */
export const roleEnum = pgEnum("role", [
  "landlord",
  "agent",
  "developer",
  "investor",
  "admin",
]);

export const tierEnum = pgEnum("tier", [
  "free",
  "pro",
  "investor",
  "business",
  "enterprise",
]);

export const themeEnum = pgEnum("theme_preference", ["light", "dark", "system"]);

export const propertyTypeEnum = pgEnum("property_type", [
  "detached",
  "semi_detached",
  "terraced",
  "flat",
  "bungalow",
  "land",
  "commercial",
]);

/* ── USERS ────────────────────────────────────────── */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    passwordHash: text("password_hash"),
    name: text("name"),
    avatarUrl: text("avatar_url"),

    tier: tierEnum("tier").notNull().default("free"),
    themePreference: themeEnum("theme_preference").notNull().default("system"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  },
  (t) => [index("users_email_idx").on(t.email)],
);

/* ── USER ROLES (join table — multi-role by design) ── */
export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.role] }),
    index("user_roles_user_idx").on(t.userId),
  ],
);

/* ── AREAS (the geospatial anchor for everything) ─── */
export const areas = pgTable(
  "areas",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Outcode, e.g. "M20" */
    outcode: text("outcode").notNull().unique(),
    district: text("district").notNull(),
    city: text("city").notNull(),
    region: text("region"),
    slug: text("slug").notNull().unique(),

    centroid: geographyPoint("centroid"),
    boundary: geographyPolygon("boundary"),

    /* Proprietary composite scores (0–100) */
    realvianScore: integer("realvian_score"),
    investmentScore: integer("investment_score"),

    /* Component dimensions */
    schoolScore: integer("school_score"),
    transportScore: integer("transport_score"),
    safetyScore: integer("safety_score"),
    greenSpaceScore: integer("green_space_score"),
    amenityScore: integer("amenity_score"),
    floodRisk: text("flood_risk"),

    /* Market figures */
    avgPrice: numeric("avg_price", { precision: 12, scale: 2 }),
    avgRent: numeric("avg_rent", { precision: 10, scale: 2 }),
    grossYield: numeric("gross_yield", { precision: 5, scale: 2 }),
    fiveYearGrowth: numeric("five_year_growth", { precision: 6, scale: 2 }),

    /* Data-quality tracking — every AI claim validates against this */
    lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),
    sourceVersions: jsonb("source_versions").$type<Record<string, string>>(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("areas_outcode_idx").on(t.outcode),
    index("areas_city_idx").on(t.city),
    index("areas_slug_idx").on(t.slug),
    index("areas_score_idx").on(t.realvianScore),
  ],
);

/* ── PROPERTIES ───────────────────────────────────── */
export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    postcode: text("postcode").notNull(),
    areaId: uuid("area_id").references(() => areas.id),
    location: geographyPoint("location"),

    propertyType: propertyTypeEnum("property_type"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    floorAreaSqm: numeric("floor_area_sqm", { precision: 8, scale: 2 }),
    tenure: text("tenure"),
    epcRating: text("epc_rating"),
    yearBuilt: integer("year_built"),

    ownerId: uuid("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("properties_postcode_idx").on(t.postcode),
    index("properties_area_idx").on(t.areaId),
    index("properties_owner_idx").on(t.ownerId),
  ],
);

/* ── SAVED COMPARISONS (anonymous allowed) ────────── */
export const comparisons = pgTable(
  "comparisons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Nullable — anonymous users can compare and share without an account */
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    areaIds: jsonb("area_ids").$type<string[]>().notNull(),
    shareToken: text("share_token").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("comparisons_user_idx").on(t.userId),
    index("comparisons_token_idx").on(t.shareToken),
  ],
);

/* ── SESSIONS (Better-Auth compatible) ────────────── */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/* ── Inferred types ───────────────────────────────── */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Area = typeof areas.$inferSelect;
export type NewArea = typeof areas.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type Comparison = typeof comparisons.$inferSelect;
export type Session = typeof sessions.$inferSelect;
