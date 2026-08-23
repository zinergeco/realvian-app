-- ═══════════════════════════════════════════════════════
-- LANDLORD PROPERTIES: current rent
--
-- Enables the "rent review suggestions benchmarked against live area
-- data" bullet from the landlord portal's original feature list — the
-- second of its four promised features to become real, following the
-- same pattern as investor and agent: check what's genuinely buildable
-- with data already trusted elsewhere on the site before assuming
-- everything needs new external data.
--
-- This is a straightforward two-number comparison (the landlord's own
-- reported rent vs. Realvian's own area average), not a generated
-- estimate — unlike EPC upgrade costs, there's no risk of fabricating
-- numbers the landlord didn't provide.
-- ═══════════════════════════════════════════════════════

ALTER TABLE properties ADD COLUMN IF NOT EXISTS current_rent numeric;
