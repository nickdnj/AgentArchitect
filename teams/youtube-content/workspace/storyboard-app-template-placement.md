# Storyboard App Template — Placement & SKILL.md Alignment

**Date:** 2026-04-23
**Requested by:** Nick
**Scope:** Where the canonical `storyboard-app/` template lives, and what SKILL.md edits keep docs honest.

---

## 1. Template Location — Recommendation

**Put it at `agents/video-script-writer/templates/storyboard-app/`.**

Rationale:

- **Prior art already exists.** `agents/presentation/templates/` holds `YouTube_Storyboard_TEMPLATE.pptx`, `Altium_TEMPLATE.pptx`, `Wharfside_TEMPLATE.pptx`. The repo's convention is already "the agent that produces deliverable X owns template X." The storyboard web app is the Video Script Writer's Gate 1 deliverable, so it owns the template.
- **Sync scripts leave it alone.** `scripts/generate-agents.js` and `scripts/generate-cowork.js` iterate `agents/<id>/` but only read `SKILL.md` and `config.json` to emit `.claude/agents/*.md` and `.claude/skills/*/SKILL.md`. Arbitrary subdirectories like `templates/` are ignored — no special handling required, no risk of overwrite.
- **Single source of truth.** Today the template lives nowhere and in two places (`jersey-stack-ep1-transistor/storyboard-app/` and `ocean-vs-space-dc/storyboard-app/`), and the two copies have already drifted by copy-paste. Canonical location = one place to patch bugs (e.g., the multi-asset upgrade) and all new projects pick it up.
- **Discoverability.** When Nick (or the Architect) reads `agents/video-script-writer/`, everything the agent needs is co-located: behavioral spec (`SKILL.md`), config (`config.json`), and the artifact it stamps out (`templates/storyboard-app/`).

**Rejected alternatives:**

- `teams/youtube-content/templates/storyboard-app/` — Would work, but breaks the existing agent-owns-its-templates pattern. Teams currently own `outputs/`, `workspace/`, `projects/`, `team.json` — not deliverable templates. Adding a `templates/` dir at the team level is a new concept for one file set.
- `agents/_templates/storyboard-app/` — `_templates/` is for **agent archetype scaffolds** (researcher, writer, reviewer, analyst) that the Architect clones when creating a new agent. A storyboard web app is a per-project deliverable, not an agent archetype. Wrong shelf.

**Directory contents (one-time migration from `ocean-vs-space-dc/storyboard-app/`, which is the better of the two existing copies):**

```
agents/video-script-writer/templates/storyboard-app/
├── server.py                  (generic — reads ./storyboard-data.json, serves ./assets/ from parent)
├── index.html                 (generic — loads storyboard-data.json via fetch)
└── storyboard-data.json.tpl   (skeleton: {project, version, date, total_runtime, scenes:[], thumbnails:[]})
```

Rename the data file to `.tpl` in the template so it's visually obvious it's a skeleton, and rename back to `.json` at project init. Optional but reduces confusion.

---

## 2. SKILL.md Edits for `agents/video-script-writer/SKILL.md`

All edits below. Show-don't-apply per the request.

### Edit A — Purpose (line 5)

**OLD:**
```
Video Script Writer handles the planning and writing phases of YouTube video production. It takes a topic brief, researches the subject, creates a chapter-structured outline, writes a word-for-word narration script organized by chapters, designs a detailed storyboard, and generates a PowerPoint storyboard deck for human review — all the creative foundation needed before asset generation begins.
```

**NEW:**
```
Video Script Writer handles the planning and writing phases of YouTube video production. It takes a topic brief, researches the subject, creates a chapter-structured outline, writes a word-for-word narration script organized by chapters, designs a detailed storyboard, and generates a browser-based storyboard review app for human review — all the creative foundation needed before asset generation begins.
```

### Edit B — Core Responsibility #5 (line 15)

**OLD:**
```
5. **PowerPoint Storyboard** - Generate a visual review deck where each chapter becomes a section of slides for human review
```

**NEW:**
```
5. **Storyboard Review Web App** - Stamp out a per-project web app (Python http.server + single-page HTML) that renders scene cards with images, narration, visual notes, and per-scene reviewer textareas with auto-save
```

### Edit C — Replace entire Phase 5 section (lines 221–251)

**OLD:**
```
### Phase 5: PowerPoint Storyboard Deck

After creating the storyboard, generate a visual review deck so the user can review the story arc in PowerPoint.

1. **Create presentation** from the YouTube Storyboard template:
   ```
   create_presentation_from_template(template_path="/app/templates/YouTube_Storyboard_TEMPLATE.pptx")
   switch_presentation(presentation_id="{returned_id}")
   ```
2. **Title slide** (Layout 0 — Title Slide): Video title, video type, target length, date
3. **Chapter overview slide** (Layout 1 — Title and Content): Title "Chapter Overview", body is bulleted list of all chapters with timestamps
4. **For each chapter:**
   - **Chapter header slide** (Layout 2 — Section Header): Chapter title + 1-sentence summary
   - **Scene detail slides** (Layout 1 — Title and Content): One per scene showing:
     - Title: "Scene {N}: {Name} ({start_time} - {end_time})"
     - Body bullets:
       - `NARRATION: "{first 2-3 sentences of narration text}"`
       - `VISUAL: {visual description from storyboard}`
       - `IMAGE: {user-provided | AI-generated | title-card}`
       - `MOTION: {ken-burns-zoom | gentle-zoom | static | pillarbox}`
       - `TRANSITION: {crossfade 1s | cut | etc.}`
   - For scenes with before/after or multiple visual concepts, use Layout 3 (Two Content)
5. **Summary slide** (Layout 1 — Title and Content): Title "Production Plan Summary", body bullets with total chapters, scenes, runtime, AI images needed, user photos, narration voice
6. **Save** to `/app/workspace/{project-slug}-storyboard.pptx`
7. **Copy** to project folder:
   ```bash
   cp /Users/nickd/Workspaces/mcp_servers/Office-PowerPoint-MCP-Server/workspace/{project-slug}-storyboard.pptx {project-folder}/script/storyboard.pptx
   ```
8. **Update project.json**: Set `phases.storyboard_pptx.status = "complete"`

**Fallback:** If PowerPoint MCP tools are unavailable, save the storyboard as a detailed markdown table in `script/storyboard-review.md` instead and inform the orchestrator.
```

**NEW:**
```
### Phase 5: Storyboard Review Web App

After creating the storyboard, stamp out a per-project web app so the user can review every scene in the browser with per-scene notes that auto-save. This replaces the older PowerPoint deck workflow.

1. **Copy the canonical template** into the project folder:
   ```bash
   cp -r /Users/nickd/Workspaces/AgentArchitect/agents/video-script-writer/templates/storyboard-app \
         {project-folder}/storyboard-app
   mv {project-folder}/storyboard-app/storyboard-data.json.tpl \
      {project-folder}/storyboard-app/storyboard-data.json
   ```
   Template contents:
   - `server.py` — Python `http.server` wrapper (~70 lines). Serves the HTML, serves `/assets/*` from the project root, and accepts POST `/save` to overwrite `storyboard-data.json`.
   - `index.html` — Single self-contained page. Dark theme, sidebar chapter nav with orange-dot badges on scenes that have notes, scene cards (image + narration + visual notes + image_prompt + music/transition/motion), per-scene notes textarea with auto-save-on-idle.
   - `storyboard-data.json` — The data model the app renders.

2. **Populate `storyboard-data.json`** from the storyboard you wrote in Phase 4. Top-level shape:
   ```json
   {
     "project": "{Video Title}",
     "version": "1.0",
     "date": "{YYYY-MM-DD}",
     "total_runtime": "{estimated minutes}",
     "scenes": [
       {
         "id": 1,
         "chapter": 1,
         "chapter_title": "{Chapter Title}",
         "title": "{Scene Title}",
         "duration": "{0:00-0:08 (8s)}",
         "narration": "{word-for-word narration text}",
         "visual": "{visual/stage direction}",
         "image_prompt": "{AI prompt, or 'N/A (user-provided)'}",
         "text_overlay": "{text overlay copy or '(none)'}",
         "motion": "{ken-burns-zoom | gentle-zoom | static | pillarbox | ken-burns-pan}",
         "music": "{music/audio cue}",
         "transition": "{Crossfade 1s | Hard cut | etc.}",
         "image_path": "assets/images/scene-01.png",
         "notes": ""
       }
     ],
     "thumbnails": []
   }
   ```
   Leave `notes` empty — the reviewer fills them. Leave `image_path` pointing at the eventual asset location even if the image hasn't been generated yet; the web app will show a placeholder until the file exists.

3. **Assign a unique port.** Each project runs on its own port so Nick can leave multiple review apps open. Use the next free port starting at 8501 (ocean-vs-space-dc = 8501, jersey-stack-ep1 = 8502, etc.). Record the chosen port in `project.json` under `storyboard_app.port` and hard-code it in that project's `server.py`.

4. **Instruct the user how to run it:**
   ```bash
   cd {project-folder}/storyboard-app
   python3 server.py
   # then open http://localhost:{port}
   ```
   Include this one-liner in the briefing you return to the orchestrator.

5. **Update `project.json`:** Set `phases.storyboard_app.status = "complete"` and record `storyboard_app.port` + `storyboard_app.path`.

**Fallback:** If the template directory is missing or Python 3 is unavailable on the target machine, save the storyboard as a detailed markdown table in `script/storyboard-review.md` and inform the orchestrator. Do not fall back to PowerPoint.
```

### Edit D — Tool Reference table (line 314)

**OLD:**
```
| PowerPoint MCP (`create_presentation_from_template`, `add_slide`, `populate_placeholder`, `add_bullet_points`, `save_presentation`) | Generate storyboard review deck |
```

**NEW:** (remove the row entirely — the storyboard review no longer uses PowerPoint MCP)

### Edit E — Success Criteria (line 325)

**OLD:**
```
- PowerPoint storyboard deck generated for human review (or markdown fallback)
```

**NEW:**
```
- Storyboard review web app scaffolded into `{project-folder}/storyboard-app/` with populated `storyboard-data.json` and assigned port (or markdown fallback)
```

### Edit F — Output briefing (lines 303, 306)

**OLD:**
```
- **PowerPoint storyboard** path (if generated) — the orchestrator will present this to the user for review
```
**NEW:**
```
- **Storyboard review app** path and port — the orchestrator tells the user: "Run `python3 server.py` in `{path}` and open http://localhost:{port} to review"
```

**OLD:**
```
- **Review gate note**: "PowerPoint storyboard ready for human review. The orchestrator should pause and ask the user to review the deck before proceeding to audio production."
```
**NEW:**
```
- **Review gate note**: "Storyboard review app ready. The orchestrator should pause, tell the user how to run the app, and wait for approval before proceeding to audio production."
```

### Edit G — `project.json` phases key (lines 271–272)

**OLD:**
```
    "storyboard_pptx": {"status": "pending"},
    "storyboard_review": {"status": "pending"},
```

**NEW:**
```
    "storyboard_app": {"status": "pending"},
    "storyboard_review": {"status": "pending"},
```

Note: this is a breaking schema change. Existing project.json files will keep their old `storyboard_pptx` keys — that's fine, they're historical records. New projects get `storyboard_app`.

---

## 3. Other SKILL docs to touch

### `agents/video-assembler/SKILL.md`

- **Status: no changes needed today.** The assembler reads `script/storyboard.md` (the markdown file), not `storyboard-data.json`. It has no references to `image_path` as a JSON field and no PowerPoint references. It's already web-app-agnostic.
- **Future (when the multi-asset schema ships):** If the software team's spec changes the storyboard markdown format to support multiple `image_path` values per scene, revisit Step 1 (orientation detection) and the per-scene segment generation loop — both assume one image per scene today. But that's a software-team task, not a docs task.

### `agents/video-asset-generator/SKILL.md`

- **Status: no changes needed today.** This agent also consumes `script/storyboard.md` and writes to `assets/images/scene-{N}-{description}.png`. It has no references to `image_path` as a JSON field and no PowerPoint references.
- **Future:** Same caveat — when the schema supports multiple assets per scene (multiple images, per-scene video clips), the naming convention `scene-{N}-{description}.png` needs to grow to `scene-{N}-{asset-index}-{description}.{ext}` or similar, and Step 2 needs to know how many images to generate per scene. Again, a software-team change.

### Not a SKILL.md but worth flagging

- `agents/presentation/templates/YouTube_Storyboard_TEMPLATE.pptx` is now orphaned. Recommend leaving it in place (it's cheap to keep, historical record) but annotating the presentation agent's SKILL.md with a one-liner: "Note: the YouTube storyboard workflow moved to the Video Script Writer's web-app template as of 2026-04. The PPTX template here is retained for reference only." (Low priority — flag for a future pass, don't block this upgrade on it.)

---

## 4. Generation / sync implications

**Short answer: zero special handling needed.**

- `scripts/generate-agents.js` and `scripts/generate-cowork.js` only read `SKILL.md` and `config.json` under each `agents/<id>/`. Arbitrary subdirectories like `templates/storyboard-app/` are **ignored by both generators** — they're not copied, not referenced, not touched.
- This is already how `agents/presentation/templates/` works today (containing `Altium_TEMPLATE.pptx`, `Wharfside_TEMPLATE.pptx`, `YouTube_Storyboard_TEMPLATE.pptx`). No one had to teach the generators about it.
- Template files are **not** pushed into `.claude/agents/` or `cowork/skills/`. The Video Script Writer agent just references the absolute path in its instructions (Phase 5 edit above), and `cp -r` does the work at project-init time.

**Gotcha to flag:** `.claude/agents/` and `cowork/skills/` are git-ignored and regenerated per-user. If someone ever moves the template into `.claude/` or `cowork/`, it would get blown away on the next sync. Keeping it under `agents/video-script-writer/templates/` avoids this entirely.

---

## Uncertainties / things to confirm with Nick

1. **Port allocation registry.** Today the port assignment is ad-hoc ("next free number starting at 8501"). Worth adding a tiny `teams/youtube-content/storyboard-app-ports.md` file tracking which project owns which port? Or keep it lazy and just scan `projects/*/project.json` at init time? Lean: lazy scan is fine until there are >5 projects.
2. **`storyboard-data.json.tpl` naming.** I recommended `.tpl` to signal it's a skeleton. If that feels too cute, name it `storyboard-data.template.json` or just `storyboard-data.json` and treat the copy step as "populate in place." Your call.
3. **Gate 2 re-runs.** Today both existing projects (ocean-vs-space, jersey-stack-ep1) use the same `storyboard-app/` directory for Gate 1 and Gate 2. Is that the intended workflow (overwrite + reload) or do you want the agent to version it (`storyboard-app-v1/`, `storyboard-app-v2/`)? Current SKILL.md is silent on Gate 2; my proposed edits keep it silent too. Flag if you want a Gate-2-specific instruction.
4. **Multi-asset schema change.** The feature upgrade (multi image/video per scene, upload/delete UI, narration play button) will break backward compat of `storyboard-data.json` unless the schema uses an `assets: []` array with a compat shim for legacy `image_path`. The software team is specing this separately, but flagging that **this SKILL.md update should land first** so Phase 5 is honest about today's reality before the schema bump lands on top.

---

## Summary of recommended actions (in order)

1. `mkdir -p agents/video-script-writer/templates/storyboard-app/`
2. Copy `ocean-vs-space-dc/storyboard-app/{server.py,index.html,storyboard-data.json}` into it; rename the JSON to `storyboard-data.json.tpl` (or your preferred convention).
3. Apply edits A–G to `agents/video-script-writer/SKILL.md`.
4. Run `/sync-agents` and `node scripts/generate-cowork.js` (docs change only — regenerates `.claude/agents/video-script-writer.md` and cowork orchestrator with the new Phase 5 text).
5. Do **not** touch `agents/video-assembler/SKILL.md` or `agents/video-asset-generator/SKILL.md` today.
6. When the software team's multi-asset spec lands, revisit the assembler/generator SKILL.md files for `image_path` → `assets[]` schema changes.
