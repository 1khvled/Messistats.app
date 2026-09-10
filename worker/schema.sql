-- messi-stats smart-check D1 schema (free tier: tiny tables, a few rows/day).
-- Run once after `wrangler d1 create messi-stats-pending`:
--   wrangler d1 execute messi-stats-pending --file=worker/schema.sql
-- NEVER stores verified totals. Only staging + dedupe state.

-- Matches already processed by the worker (dedupe so each match is staged once).
CREATE TABLE IF NOT EXISTS seen_matches (
  match_id    TEXT PRIMARY KEY,
  competition TEXT NOT NULL,
  match_date  TEXT NOT NULL,
  home        TEXT,
  away        TEXT,
  score       TEXT,
  seen_at     TEXT NOT NULL
);

-- Candidate updates. status is one of: provisional | needs_review | confirmed.
-- provisional  = ESPN + openfootball AGREE on result AND scorer data names Messi.
-- needs_review = sources disagree, scorer detail missing, or single-source (MLS).
-- confirmed    = a human ran the confirm step (see scripts/confirm-provisional.mjs).
CREATE TABLE IF NOT EXISTS pending_checks (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id           TEXT NOT NULL UNIQUE,
  competition        TEXT NOT NULL,
  match_date         TEXT NOT NULL,
  home               TEXT NOT NULL,
  away               TEXT NOT NULL,
  score_espn         TEXT,
  score_openfootball TEXT,
  sources_agree      INTEGER NOT NULL DEFAULT 0,
  messi_goals        INTEGER,
  messi_assists      INTEGER,
  messi_named        INTEGER NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'needs_review',
  sources            TEXT NOT NULL DEFAULT '[]',
  fetched_at         TEXT NOT NULL,
  note               TEXT
);

CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_checks (status);
-- Supports the worker's GET /smart-check-status query (ORDER BY match_date DESC).
CREATE INDEX IF NOT EXISTS idx_pending_match_date ON pending_checks (match_date DESC);