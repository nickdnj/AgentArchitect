-- 0002_indexes.sql — hot-path indexes for worker poll and review-queue list

-- Worker polls render_attempt by state every 2s
CREATE INDEX IF NOT EXISTS idx_render_attempt_state
  ON render_attempt(state);

-- Review Queue list filters variants by status
CREATE INDEX IF NOT EXISTS idx_variant_status
  ON variant(status);

-- TW journey watermark queries: most recently created order_journey row
CREATE INDEX IF NOT EXISTS idx_order_journey_created
  ON order_journey(created_at DESC);

-- Per-ad rollup lookup: filter by model + source + window for the queue sidebar
CREATE INDEX IF NOT EXISTS idx_ad_perf_lookup
  ON ad_performance(attribution_model, source, window_end DESC);

-- Approvals filtered by variant for audit trails
CREATE INDEX IF NOT EXISTS idx_approval_variant
  ON approval(variant_id);

-- Hook set lookup by brief
CREATE INDEX IF NOT EXISTS idx_hook_set_brief
  ON hook_set(brief_id);
