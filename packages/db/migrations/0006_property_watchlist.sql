-- ═══════════════════════════════════════════════════════
-- PROPERTY WATCHLIST
--
-- The last "coming to this account" promise from the account page.
-- Distinct from the `properties` table (0004) — that one is a
-- landlord's compliance tracker for properties they already own. This
-- one is for anyone evaluating a purchase: a lightweight pipeline from
-- "found it" through to "offer made" or "passed on it".
--
-- Realvian doesn't hold individual property listings (scraping
-- Rightmove/Zoopla was ruled out for litigation risk early in this
-- project), so this is deliberately a manual, user-entered watchlist
-- with a link out to wherever the listing actually lives — not an
-- attempt to mirror portal data we don't have rights to.
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS property_watchlist (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  nickname      text NOT NULL,       -- e.g. "3-bed semi, Chorlton"
  postcode      text NOT NULL,
  outcode       text,                -- derived via toOutcode(), links to Realvian's own area score
  city          text,
  region        text,

  price         numeric,             -- asking price, nullable — not always known/settled yet
  listing_url   text,                -- link to the actual listing (Rightmove/Zoopla/agent site)

  -- A simple pipeline, not a generic free-text status — keeping it a
  -- fixed set makes the UI able to render a real progress indicator
  -- instead of just an arbitrary label.
  status        text NOT NULL DEFAULT 'researching',
  -- researching | viewing_booked | viewed | offer_made | under_offer | withdrawn

  notes         text,

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_watchlist_user_idx ON property_watchlist(user_id);
