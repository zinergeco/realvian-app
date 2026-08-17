-- ═══════════════════════════════════════════════════════
-- PUBLIC USER SESSIONS
--
-- The `users` table already exists (Phase 0 schema, applied earlier).
-- This adds the missing `sessions` table so signup/login can actually
-- work — until now there was a users table with nowhere to record who's
-- currently signed in.
--
-- Deliberately a SEPARATE table from admin_sessions, not a shared one:
-- public visitor sessions and staff admin sessions are different trust
-- boundaries with different lifetimes (30 days vs 12 hours) and different
-- consequences if compromised. Merging them would mean one code path
-- has to reason about both, which is exactly the kind of shortcut that
-- turns into a privilege-escalation bug later.
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sessions (
  id          text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);
