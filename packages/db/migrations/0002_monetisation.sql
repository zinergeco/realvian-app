-- ═══════════════════════════════════════════════════════
-- REALVIAN MONETISATION SCHEMA
--
-- One coherent system covering: affiliate programmes, affiliate products,
-- paid business listings, sponsored placements, and click attribution.
--
-- ── GEOGRAPHIC ROUTING (the piece that makes this work) ──
-- Every listing and product carries a geographic scope:
--     national  → shows everywhere
--     region    → shows on areas in that region
--     city      → shows on areas in that city
--     outcode   → shows only on that specific area page
--
-- When a business signs up and gives a postcode, we resolve it to an
-- outcode, look up the area, and inherit city + region automatically.
-- So a Manchester plumber appears on every Manchester area page without
-- anyone tagging 38 pages by hand.
--
-- ── LEGAL POSITION ──
-- CAP Code and ASA rules require paid placements to be *obviously*
-- identifiable as advertising. `is_paid` drives a visible label on every
-- surface; it is not optional and not stylistic. Affiliate links carry
-- rel="sponsored nofollow" per Google's guidance. Undisclosed advertising
-- is both an ASA breach and a CMA consumer-protection issue.
-- ═══════════════════════════════════════════════════════

-- ── AFFILIATE PROGRAMMES ──
-- The commercial relationship: who we have a deal with and on what terms.
CREATE TABLE IF NOT EXISTS affiliate_programs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  -- mortgage | conveyancing | survey | insurance | removals | utilities |
  -- furniture | trades | banking | education | investment | other
  category        text NOT NULL,
  network         text,                    -- 'awin' | 'direct' | 'impact' | ...
  base_url        text NOT NULL,
  tracking_param  text,                    -- e.g. 'ref' or 'aid'
  tracking_value  text,                    -- our publisher id
  -- Commercials, for reporting on what actually earns
  commission_type text,                    -- 'cpa' | 'cpl' | 'percentage'
  commission_value numeric(10,2),
  -- Editorial guardrails
  active          boolean NOT NULL DEFAULT true,
  priority        integer NOT NULL DEFAULT 50,   -- higher wins ties
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS aff_programs_cat_idx ON affiliate_programs(category, active);

-- ── AFFILIATE PRODUCTS ──
-- Individual placeable offers. The content engine selects from these.
CREATE TABLE IF NOT EXISTS affiliate_products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      uuid NOT NULL REFERENCES affiliate_programs(id) ON DELETE CASCADE,
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  description     text NOT NULL,
  destination_url text NOT NULL,
  media_id        uuid REFERENCES media(id) ON DELETE SET NULL,
  cta_label       text NOT NULL DEFAULT 'Learn more',

  -- CONTEXTUAL MATCHING: which content this product belongs on.
  -- The content engine reads these to place products where they're
  -- genuinely relevant rather than scattering them everywhere.
  match_topics    text[],       -- ['yield','investment','mortgage']
  match_personas  text[],       -- ['investor','first-time-buyer','landlord']
  match_post_kinds text[],      -- ['ranking','city-report','comparison']

  -- GEOGRAPHIC SCOPE
  scope_type      text NOT NULL DEFAULT 'national',  -- national|region|city|outcode
  scope_value     text,                              -- NULL when national

  active          boolean NOT NULL DEFAULT true,
  priority        integer NOT NULL DEFAULT 50,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS aff_products_scope_idx ON affiliate_products(scope_type, scope_value, active);
CREATE INDEX IF NOT EXISTS aff_products_topics_idx ON affiliate_products USING GIN(match_topics);

-- ── BUSINESS LISTINGS ──
-- Local businesses: estate agents, brokers, trades, surveyors, movers.
CREATE TABLE IF NOT EXISTS business_listings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name   text NOT NULL,
  slug            text NOT NULL UNIQUE,
  category        text NOT NULL,   -- estate_agent | mortgage_broker | solicitor |
                                   -- surveyor | builder | removals | cleaner | other
  description     text NOT NULL,

  -- CONTACT
  website         text,
  phone           text,
  email           text,

  -- LOCATION — the postcode drives everything else
  address_line    text,
  postcode        text NOT NULL,
  outcode         text NOT NULL,   -- derived from postcode on insert
  city            text,            -- resolved from areas table
  region          text,            -- resolved from areas table
  location        geography(Point, 4326),

  -- TIER: drives placement, prominence and how many areas it appears on
  tier            text NOT NULL DEFAULT 'free',   -- free | featured | premium
  -- free     → directory only
  -- featured → appears on its own outcode's area page
  -- premium  → appears across its whole city
  is_paid         boolean NOT NULL DEFAULT false,

  media_id        uuid REFERENCES media(id) ON DELETE SET NULL,
  logo_media_id   uuid REFERENCES media(id) ON DELETE SET NULL,

  -- TRUST SIGNALS
  verified        boolean NOT NULL DEFAULT false,
  verified_at     timestamptz,
  rating_avg      numeric(3,2),
  review_count    integer NOT NULL DEFAULT 0,

  -- LIFECYCLE
  status          text NOT NULL DEFAULT 'pending', -- pending|approved|rejected|expired
  approved_by     uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  approved_at     timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS listings_outcode_idx ON business_listings(outcode, status);
CREATE INDEX IF NOT EXISTS listings_city_idx ON business_listings(city, status);
CREATE INDEX IF NOT EXISTS listings_cat_idx ON business_listings(category, status);
CREATE INDEX IF NOT EXISTS listings_geo_gix ON business_listings USING GIST(location);

-- ── AD PLACEMENTS ──
-- Named slots. Keeping slots as data means we can cap density per page
-- and retire a slot without a deploy.
CREATE TABLE IF NOT EXISTS ad_slots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          text NOT NULL UNIQUE,   -- 'area_sidebar' | 'blog_mid' | 'area_footer'
  label        text NOT NULL,
  -- Hard ceiling on how many items may render in this slot.
  -- Master plan caps ad density at 10-15% of page real estate; this enforces it.
  max_items    integer NOT NULL DEFAULT 3,
  active       boolean NOT NULL DEFAULT true
);

-- ── CLICK TRACKING ──
-- Append-only. Powers revenue reporting and lets us drop products that
-- earn nothing rather than leaving clutter on the page.
CREATE TABLE IF NOT EXISTS click_events (
  id            bigserial PRIMARY KEY,
  -- What was clicked
  target_type   text NOT NULL,     -- 'affiliate_product' | 'business_listing'
  target_id     uuid NOT NULL,
  -- Where from
  source_path   text NOT NULL,     -- '/areas/didsbury-m20'
  slot_key      text,
  -- Context, for attribution analysis
  area_outcode  text,
  post_slug     text,
  -- Visitor (deliberately coarse — see note)
  session_hash  text,              -- salted hash, NOT an identifier
  user_agent_class text,           -- 'mobile' | 'desktop' | 'bot'
  referrer_host text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clicks_target_idx ON click_events(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS clicks_created_idx ON click_events(created_at DESC);

-- NOTE ON PRIVACY
-- click_events deliberately stores NO IP address and no raw identifier.
-- session_hash is a salted daily-rotating hash, which is enough to
-- deduplicate clicks without being personal data under UK GDPR. Storing
-- raw IPs against commercial click data would make this a far heavier
-- compliance object for no analytical gain.

-- ── IMPRESSION COUNTS ──
-- Aggregated rather than per-event: per-impression rows would be the
-- highest-volume table on the platform for very little extra insight.
CREATE TABLE IF NOT EXISTS impression_daily (
  day          date NOT NULL,
  target_type  text NOT NULL,
  target_id    uuid NOT NULL,
  slot_key     text,
  count        integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, target_type, target_id, slot_key)
);

-- ── SEED: default slots ──
INSERT INTO ad_slots (key, label, max_items) VALUES
  ('area_sidebar',  'Area page — sidebar',        3),
  ('area_services', 'Area page — local services', 4),
  ('blog_mid',      'Blog post — mid-article',    1),
  ('blog_footer',   'Blog post — after content',  2),
  ('compare_below', 'Comparison — below table',   2)
ON CONFLICT (key) DO NOTHING;

-- ── SEED: starter affiliate programmes ──
-- Placeholders with real category structure. URLs are intentionally blank
-- until actual commercial agreements exist — never ship live links you
-- have not signed a contract for.
INSERT INTO affiliate_programs (name, slug, category, base_url, commission_type, active, priority, notes) VALUES
  ('Mortgage broker network', 'mortgage-brokers', 'mortgage', 'https://example.invalid/mortgage', 'cpl', false, 90, 'PLACEHOLDER — replace with signed partner'),
  ('Conveyancing quotes',     'conveyancing',     'conveyancing', 'https://example.invalid/convey', 'cpa', false, 80, 'PLACEHOLDER'),
  ('Home survey booking',     'surveys',          'survey', 'https://example.invalid/survey', 'cpa', false, 70, 'PLACEHOLDER'),
  ('Landlord insurance',      'landlord-insurance','insurance', 'https://example.invalid/insure', 'cpa', false, 75, 'PLACEHOLDER'),
  ('Removals comparison',     'removals',         'removals', 'https://example.invalid/removals', 'cpl', false, 60, 'PLACEHOLDER')
ON CONFLICT (slug) DO NOTHING;
