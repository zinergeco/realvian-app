-- ═══════════════════════════════════════════════════════
-- LANDLORD PROPERTY COMPLIANCE TRACKER
--
-- The first genuinely FUNCTIONAL piece of Phase 2. The other three
-- portals (investor, agent, developer) still show honest "coming soon"
-- pages because they depend on data or business relationships that
-- don't exist yet (off-market deal flow, lead management, planning
-- data). This one needs neither — a landlord tracking their own
-- properties' compliance dates is pure user-owned data, buildable today.
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS properties (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  nickname            text NOT NULL,      -- e.g. "14 Elm Street" or "Flat 2B"
  postcode            text NOT NULL,
  outcode             text,               -- derived via toOutcode() at insert time
  city                text,               -- resolved via the area dataset where possible
  region              text,

  epc_rating          text,               -- 'A'..'G', nullable — not every landlord knows it offhand
  epc_expiry          date,
  gas_safety_expiry   date,               -- annual, only relevant if gas appliances present
  eicr_expiry         date,               -- Electrical Installation Condition Report, 5-year cycle

  notes               text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS properties_user_idx ON properties(user_id);

-- NOTE ON SCOPE: no separate "compliance_items" table. Three fixed
-- deadline types (EPC, gas safety, EICR) cover the great majority of a
-- residential landlord's statutory obligations, and hard-coding them as
-- columns keeps the query that computes "what's most urgent" a single
-- cheap comparison rather than a join + aggregate. If HMO-specific or
-- other compliance types are needed later, that is a genuine reason to
-- introduce a proper compliance_items table — not a shortcut worth
-- taking pre-emptively.
