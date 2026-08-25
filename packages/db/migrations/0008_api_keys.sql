-- ═══════════════════════════════════════════════════════
-- API KEYS
--
-- Free, self-serve keys for the public API — no billing exists yet,
-- so this isn't a paid tier gate. It exists purely so a signed-in
-- caller gets a real, higher rate limit instead of sharing one
-- anonymous IP-based bucket with every other visitor, and so we have
-- a way to identify and (if ever needed) revoke access to a specific
-- integration without punishing everyone else.
--
-- key_hash is a SHA-256 hash of the actual key — the raw key is shown
-- to the user exactly once, at generation time, and never stored or
-- displayed again. key_prefix is the first 8 characters of the raw
-- key, kept in plaintext purely so a user can tell their keys apart
-- in a list without needing the full secret.
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  key_hash      text NOT NULL UNIQUE,
  key_prefix    text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz
);

CREATE INDEX IF NOT EXISTS api_keys_user_idx ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_hash_idx ON api_keys(key_hash) WHERE revoked_at IS NULL;
