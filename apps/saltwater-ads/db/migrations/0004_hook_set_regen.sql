-- Joe's "Regen with feedback" creates a new hook_set seeded with his
-- review notes. The pipeline reads regen_feedback when running the LLM
-- so the new hooks actually incorporate the feedback. parent_hook_set_id
-- tracks lineage for analytics + the audit trail.

ALTER TABLE hook_set ADD COLUMN parent_hook_set_id INTEGER REFERENCES hook_set(id);
ALTER TABLE hook_set ADD COLUMN regen_feedback TEXT;

CREATE INDEX IF NOT EXISTS idx_hook_set_parent ON hook_set(parent_hook_set_id) WHERE parent_hook_set_id IS NOT NULL;
