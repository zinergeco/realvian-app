-- ═══════════════════════════════════════════════════════
-- REALVIAN CMS SCHEMA
--
-- Design principle: the CMS stores OVERRIDES, not content.
--
-- Blog posts are generated from data (lib/blog.ts). The CMS does not
-- replace that — it layers editorial control on top:
--
--   • Override a generated title, description or section prose
--   • Attach or swap an image on any post, page or area
--   • Hide a post entirely without deleting code
--
-- Anything not overridden keeps regenerating from data. That means the
-- monthly refresh still updates figures, but a hand-edited headline
-- survives the refresh. Replacing generation with stored content would
-- throw away the whole point of the programmatic engine.
-- ═══════════════════════════════════════════════════════

-- ── ADMIN USERS ──
-- Separate from the public `users` table. Admin access is a different
-- trust boundary and should never be a flag on a customer record.
CREATE TABLE IF NOT EXISTS admin_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name          text,
  role          text NOT NULL DEFAULT 'editor',  -- editor | admin
  totp_secret   text,                            -- 2FA, required for admin role
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  disabled_at   timestamptz
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id         text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_sessions_user_idx ON admin_sessions(user_id);

-- ── MEDIA LIBRARY ──
CREATE TABLE IF NOT EXISTS media (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      text NOT NULL,
  storage_key   text NOT NULL UNIQUE,   -- path on disk or R2 object key
  mime_type     text NOT NULL,
  bytes         integer NOT NULL,
  width         integer,
  height        integer,
  -- Accessibility is not optional. Enforced at the application layer too.
  alt_text      text NOT NULL,
  caption       text,
  credit        text,                   -- photographer / licence attribution
  -- Licence provenance. A commercial property site must be able to prove
  -- it had the right to publish every image.
  licence       text,                   -- e.g. 'owned', 'unsplash', 'shutterstock-12345'
  focal_x       numeric(4,3) DEFAULT 0.5,  -- smart-crop anchor, 0-1
  focal_y       numeric(4,3) DEFAULT 0.5,
  uploaded_by   uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE INDEX IF NOT EXISTS media_created_idx ON media(created_at DESC);

-- ── CONTENT OVERRIDES ──
-- One row per (entity_type, entity_key). Absent row = pure generated output.
CREATE TABLE IF NOT EXISTS content_overrides (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  text NOT NULL,   -- 'post' | 'area' | 'page'
  entity_key   text NOT NULL,   -- slug
  -- NULL means "don't override this field"
  title        text,
  description  text,
  excerpt      text,
  -- Section-level prose overrides, keyed by section heading:
  --   { "The short answer": ["para one", "para two"] }
  sections     jsonb,
  hero_media_id uuid REFERENCES media(id) ON DELETE SET NULL,
  -- Extra images placed within the body, ordered
  body_media   jsonb,           -- [{ mediaId, afterSection, size }]
  hidden       boolean NOT NULL DEFAULT false,
  noindex      boolean NOT NULL DEFAULT false,
  updated_by   uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_key)
);
CREATE INDEX IF NOT EXISTS overrides_lookup_idx ON content_overrides(entity_type, entity_key);

-- ── SITE SETTINGS ──
-- Global editable values, so copy changes don't need a deploy.
CREATE TABLE IF NOT EXISTS site_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  description text,
  updated_by  uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── AUDIT LOG ──
-- Every content and media mutation. Needed for accountability and for
-- answering "who changed this figure and when" if a claim is challenged.
CREATE TABLE IF NOT EXISTS audit_log (
  id          bigserial PRIMARY KEY,
  actor_id    uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  actor_email text,
  action      text NOT NULL,       -- 'create' | 'update' | 'delete' | 'login'
  entity_type text NOT NULL,
  entity_key  text,
  diff        jsonb,               -- { field: [before, after] }
  ip_address  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_log(entity_type, entity_key);

-- ── SEED SETTINGS ──
INSERT INTO site_settings (key, value, description) VALUES
  ('hero_headline', '"Know an area before you commit to it."', 'Homepage H1'),
  ('hero_subhead', '"Realvian scores every UK postcode across 24 data dimensions."', 'Homepage sub-headline'),
  ('announcement', 'null', 'Site-wide banner. null to hide.'),
  ('blog_intro', '"Every report here is generated from the underlying dataset."', 'Blog index intro')
ON CONFLICT (key) DO NOTHING;
