-- Realvian: enable PostGIS before any geometry columns are created.
-- Run this first, ahead of the Drizzle-generated migrations.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
