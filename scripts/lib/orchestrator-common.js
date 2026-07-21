/**
 * Shared orchestrator instructions injected into EVERY team orchestrator at
 * generate time.
 *
 * Source of truth: teams/_shared/orchestrator-common.md
 *
 * Why this exists: orchestrator_instructions in team.json is a per-team verbatim
 * string. Guidance that must hold for every team (how to spawn a deliverable into
 * its own repo via `aa new`) had no single home, so no team had it — a team
 * orchestrator would hit a request outside its roster and dead-end instead of
 * reaching for the launcher. See docs/factory-model.md.
 *
 * Consumed by generate-agents.js, generate-cowork.js, and deploy-cowork.js.
 */
const fs = require('fs');
const path = require('path');

const COMMON_PATH = path.join(__dirname, '..', '..', 'teams', '_shared', 'orchestrator-common.md');

/**
 * Read the shared orchestrator block, resolving ${AA_ROOT} placeholders.
 *
 * @param {string} aaRoot Absolute path to the AgentArchitect checkout.
 * @returns {string} Block content, or '' if the file is missing (non-fatal —
 *   generation continues with team-specific instructions only).
 */
function loadCommonInstructions(aaRoot) {
  let raw;
  try {
    raw = fs.readFileSync(COMMON_PATH, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`  [WARN] shared orchestrator block missing at ${COMMON_PATH} — orchestrators will generate without it`);
      return '';
    }
    throw err;
  }
  return raw.split('${AA_ROOT}').join(aaRoot).trimEnd();
}

module.exports = { loadCommonInstructions, COMMON_PATH };
