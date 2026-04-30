-- 0001_init.sql — Saltwater AI Ads
-- Source: PRD §6.6 (9 core tables) + SAD §5.3 (auth_token + audit_log) + SAD §9.2 (schema_version)
-- Run via: bun run db:migrate
--
-- PRAGMAs are set on every connection open by db/client.ts. They cannot run
-- inside a transaction (SQLite raises "Safety level may not be changed
-- inside a transaction"), and migrate.ts wraps each migration in
-- BEGIN IMMEDIATE — so PRAGMA lines must NOT live in migration files.

-- ----------------------------------------------------------------------
-- Schema version tracking (idempotent migrations)
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_version (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------
-- Brand bucket version snapshot
-- Captures SHA-256 of every bucket file per generation.
-- Prompt cache key = brand_bucket_version.id + brief shape.
-- ----------------------------------------------------------------------
CREATE TABLE brand_bucket_version (
  id INTEGER PRIMARY KEY,
  captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  voice_sha256 TEXT NOT NULL,
  customer_sha256 TEXT NOT NULL,
  winning_patterns_sha256 TEXT NOT NULL,   -- v0.4: 6th bucket file
  products_sha256 TEXT NOT NULL,
  hooks_winners_sha256 TEXT NOT NULL,
  hooks_losers_sha256 TEXT NOT NULL
);

-- ----------------------------------------------------------------------
-- Brief — operator's input (Joe submits via Generate screen)
-- ----------------------------------------------------------------------
CREATE TABLE brief (
  id INTEGER PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  operator TEXT NOT NULL,        -- 'joe' | 'nick' | future operators
  free_text TEXT NOT NULL,
  sku_id TEXT,                   -- nullable, FK informally to products.json
  pattern TEXT,                  -- 'founder' | 'problem_solution' | 'limited_drop' | NULL
  audience_tag TEXT,
  season TEXT
);

-- ----------------------------------------------------------------------
-- Hook set — one LLM call per brief, generates 3 main variants × 3 sub-variants
-- ----------------------------------------------------------------------
CREATE TABLE hook_set (
  id INTEGER PRIMARY KEY,
  brief_id INTEGER NOT NULL REFERENCES brief(id),
  brand_bucket_version_id INTEGER NOT NULL REFERENCES brand_bucket_version(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  model TEXT NOT NULL,           -- 'claude-sonnet-4-6' etc
  prompt_hash TEXT NOT NULL,     -- SHA-256 of full assembled prompt (cache key)
  status TEXT NOT NULL           -- 'generating' | 'ready' | 'failed'
);

-- ----------------------------------------------------------------------
-- Variant — one row per main hook variant (3 per hook_set)
-- Sub-variants V1/V2/V3 ride along inside hook_text + sub_variant_label
-- ----------------------------------------------------------------------
CREATE TABLE variant (
  id INTEGER PRIMARY KEY,
  hook_set_id INTEGER NOT NULL REFERENCES hook_set(id),
  hook_text TEXT NOT NULL,             -- ≤140 chars
  sub_variant_label TEXT NOT NULL,     -- 'V1' | 'V2' | 'V3'
  sku_id TEXT,
  pattern TEXT,
  status TEXT NOT NULL                 -- 'queued' | 'rendering' | 'ready_for_review' | 'approved' | 'rejected' | 'failed'
);

-- ----------------------------------------------------------------------
-- Render attempt — state machine row (PRD §6.5)
-- One per attempt per variant; retries create new rows
-- ----------------------------------------------------------------------
CREATE TABLE render_attempt (
  id INTEGER PRIMARY KEY,
  variant_id INTEGER NOT NULL REFERENCES variant(id),
  attempt_number INTEGER NOT NULL,
  state TEXT NOT NULL,                 -- 'queued' | 'hooks_generating' | 'hooks_ready' | 'vendor_pending' | 'partial' | 'assembling' | 'ready_for_review' | 'approved' | 'rejected' | 'failed_recoverable' | 'failed_terminal' | 'cancelled'
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  heygen_clip_id TEXT,
  fashn_clip_id TEXT,
  broll_id TEXT,
  higgsfield_clip_id TEXT,
  cost_credits_total REAL DEFAULT 0,
  error_message TEXT
);

-- ----------------------------------------------------------------------
-- Asset — rendered file metadata + AI disclosure layers
-- ----------------------------------------------------------------------
CREATE TABLE asset (
  id INTEGER PRIMARY KEY,
  render_attempt_id INTEGER NOT NULL REFERENCES render_attempt(id),
  type TEXT NOT NULL,                  -- 'mp4' | 'jpg' | 'srt'
  path TEXT NOT NULL,                  -- relative to media root
  size_bytes INTEGER,
  ai_disclosure_layers TEXT            -- JSON array: ["heygen","fashn","higgsfield"]
);

-- ----------------------------------------------------------------------
-- Approval — operator's approve/regen/reject decision
-- AI disclosure acknowledgement is enforced by web app at approve time
-- ----------------------------------------------------------------------
CREATE TABLE approval (
  id INTEGER PRIMARY KEY,
  variant_id INTEGER NOT NULL REFERENCES variant(id),
  approved_by TEXT NOT NULL,
  approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  decision TEXT NOT NULL,              -- 'approve' | 'regen' | 'reject'
  notes TEXT
);

-- ----------------------------------------------------------------------
-- Publish event — record of pushing to Meta (Sprint 2)
-- ----------------------------------------------------------------------
CREATE TABLE publish_event (
  id INTEGER PRIMARY KEY,
  variant_id INTEGER NOT NULL REFERENCES variant(id),
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  meta_ad_id TEXT,
  campaign_id TEXT,
  ad_set_id TEXT
);

-- ----------------------------------------------------------------------
-- TW Connector storage (PRD v0.4 §6.1.3 — replaces the deprecated
-- performance_snapshot table).
--
-- Why three tables instead of one: live TW API probe (2026-04-30) confirmed
-- per-ad spend / impressions / clicks / hook_rate are NOT exposed via
-- x-api-key auth. Sprint 1 stores account-level summary + per-order journey,
-- and computes per-ad revenue rank by configurable attribution model.
-- Sprint 2+ adds Meta Ads Manager API for real spend, at which point
-- performance_snapshot returns (with a different table name to avoid confusion).
-- ----------------------------------------------------------------------

-- Account-level summary cache (fed by /summary-page/get-data — F-TW-2)
CREATE TABLE account_metric_snapshot (
  id INTEGER PRIMARY KEY,
  pulled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  window_start DATE NOT NULL,
  window_end DATE NOT NULL,
  metric_id TEXT NOT NULL,         -- 'sales', 'shopifyAov', 'roas', 'mer', etc.
  current_value REAL,
  previous_value REAL,
  delta_pct REAL,
  UNIQUE(window_start, window_end, metric_id)
);

-- Per-order journey cache (fed by /attribution/get-orders-with-journeys-v2 — F-TW-3)
CREATE TABLE order_journey (
  id INTEGER PRIMARY KEY,
  pulled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  order_id TEXT NOT NULL,
  order_name TEXT,
  total_price REAL,
  currency TEXT,
  created_at TIMESTAMP,
  customer_id TEXT,
  attribution_json TEXT NOT NULL,  -- full attribution object: 6 models × clicks
  UNIQUE(order_id)
);

-- Per-ad rollup (post-processed view, refreshed on each sync — F-TW-5)
CREATE TABLE ad_performance (
  id INTEGER PRIMARY KEY,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attribution_model TEXT NOT NULL,  -- 'fullFirstClick' | 'fullLastClick' | etc.
  source TEXT NOT NULL,
  ad_id TEXT,
  campaign_id TEXT,
  adset_id TEXT,
  window_start DATE NOT NULL,
  window_end DATE NOT NULL,
  order_count INTEGER NOT NULL,
  revenue REAL NOT NULL,
  computed_aov REAL,                 -- revenue / order_count
  UNIQUE(attribution_model, source, ad_id, window_start, window_end)
);

-- ----------------------------------------------------------------------
-- Auth token — magic-link single-use tokens
-- (SAD §5.3)
-- ----------------------------------------------------------------------
CREATE TABLE auth_token (
  token_hash TEXT PRIMARY KEY,         -- SHA-256 of raw token (raw token is emailed, never stored)
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_auth_token_expires ON auth_token(expires_at);

-- ----------------------------------------------------------------------
-- Audit log — sensitive events for compliance + debugging
-- (SAD §5.3 + §11)
-- ----------------------------------------------------------------------
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY,
  at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email TEXT,
  request_id TEXT,
  action TEXT NOT NULL,                -- 'login' | 'generate' | 'approve' | 'reject' | 'secret_update' | 'tw_sync' | 'magic_link_send'
  target_type TEXT,                    -- 'brief' | 'variant' | 'secret'
  target_id TEXT,
  meta_json TEXT
);
CREATE INDEX idx_audit_log_at ON audit_log(at DESC);
