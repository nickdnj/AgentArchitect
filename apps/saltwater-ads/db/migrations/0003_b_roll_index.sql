-- 0003_b_roll_index.sql — B-roll clip catalog (PRD §6.1.4 F-RO-4)
-- Render Orchestrator's B-roll selector picks from real Saltwater outdoor footage tagged here.

CREATE TABLE b_roll_clip (
  id INTEGER PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,           -- relative to media/b-roll/
  duration_seconds REAL NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  tags TEXT NOT NULL,                  -- JSON array: ["beach","summer","golf","boat","memorial-day", ...]
  season TEXT,                         -- 'all' | 'spring' | 'summer' | 'fall' | 'winter'
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_b_roll_season ON b_roll_clip(season);
