-- ═══════════════════════════════════════════════════════
-- FOLLOWED AREAS
--
-- Deliberately just a bookmark table, not a notification queue. The
-- account page previously promised "follow areas and get notified when
-- their score changes" — that second half needs an email-sending
-- pipeline that doesn't exist yet (sender domain, deliverability,
-- unsubscribe handling — infrastructure decisions, not something to
-- invent unprompted). This migration ships the honest, buildable half:
-- track which areas someone cares about, so they're one click away
-- instead of a re-search. The copy this ships with says "track", not
-- "notify" — matching what's actually built.
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS followed_areas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_slug   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, area_slug)
);

CREATE INDEX IF NOT EXISTS followed_areas_user_idx ON followed_areas(user_id);
