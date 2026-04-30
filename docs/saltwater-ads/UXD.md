# UX Design Document: Saltwater AI Ads — Sprint 1

**Version:** 1.0
**Last Updated:** 2026-04-30
**Author:** Nick DeMarco (with AI assistance)
**Status:** Draft — for engineering handoff
**PRD Reference:** `/docs/saltwater-ads/PRD.md` v0.3
**Prototype Reference:** `/docs/saltwater-ads/prototype/index.html` (visual North Star)
**Frontend Stack:** Vite + React SPA. Tailwind CSS v3 recommended — utility-first pairs naturally with the design-token set defined in §11; Inter + JetBrains Mono loaded via Google Fonts (already wired in prototype, line 8–9).

---

## 1. Operator Persona Snapshot

Three actors touch the system. Their needs diverge sharply enough to govern every design call.

### 1.1 Joe DeMarco — Primary Operator

Joe is the daily driver. He runs Saltwater's paid social, manages Meta Ads Manager, reads Triple Whale. He is not technical, not a CLI user, and will not invest more than 5 minutes of active attention per ad.

**What Joe needs from this UI:**
- A calm, fast brief-entry surface. One textarea, one button, done.
- Instant visual status — is anything rendering? Anything ready to review?
- A frictionless review flow: watch the video, read the hook, approve or reject. No settings spelunking.
- A hard disclosure gate that keeps him compliant with Meta policy without him having to remember it.
- An honest wait indicator. He submits the brief, goes back to whatever he was doing, comes back when it's ready. The UI must not pretend 8–12 minutes is fast.

**What Joe explicitly does NOT need:**
- Dashboard analytics, ROAS charts, or hit-rate trend graphs. He reads TW directly.
- A CLI. Never.
- Multiple login accounts, role management, or collaboration flows.
- In-app editing of brand bucket files (Settings uploader is the limit).

### 1.2 Nick DeMarco — Builder + Light Maintainer

Nick will use the system to test generations during Sprint 1–1.5 and may trigger ad batches during light-maintenance months. His session behavior mirrors Joe's from the UI perspective.

**What Nick needs:**
- The same 3 screens Joe uses — no separate admin panel in v1.
- Access to the Settings screen for API key rotation and brand bucket file swaps.
- Audit log read access (Settings > Audit Log) during debugging.

**What Nick does NOT need via the web app:**
- Direct SQLite access.
- Developer console or log streaming.
- A separate operator identity in the UI (both Joe and Nick are whitelisted magic-link users; audit log differentiates by email).

### 1.3 Buddy DeMarco — Co-Owner Stakeholder (Sprint 2, Deferred)

Buddy reviews ads before launch, especially Founder Story content. In v1, Joe forwards approved MP4s to Buddy by text or email. Buddy has no login, no web app session, and no UI requirements in Sprint 1.

**What Buddy gets in Sprint 1:** Nothing. Joe's download flow is the handoff.

**What Buddy gets in Sprint 2:** Signed expiring preview-link (24-hour TTL, no account needed) so Joe can forward a URL instead of a file. Build the preview-link screen only when Buddy asks for it. Do not stub it in Sprint 1.

---

## 2. Information Architecture

### 2.1 Site Map

```
Saltwater AI Ads (authenticated SPA)
├── Generate                     ← default landing screen
│   ├── Brief form (left)
│   ├── Top hooks sidebar (right)
│   └── Recent variants strip (bottom)
├── Review Queue                 ← badge count: pending variants
│   ├── Variant list (left panel)
│   └── Detail pane (right panel)
│       ├── Single-variant view (default)
│       └── Compare mode (toggle — 3 variants side-by-side)
└── Settings
    ├── API Keys
    ├── Brand Bucket
    ├── Default Config
    ├── Account
    └── Audit Log
```

### 2.2 Navigation Model

The sidebar is a fixed 220px left column present on all authenticated screens (prototype line 46–48: `grid-template-columns: 220px 1fr`). It contains:

- Brand mark + wordmark ("Saltwater AI Ads") at top
- Three nav items: Generate, Review Queue, Settings
- Review Queue carries a red badge showing the count of `ready_for_review` variants. Badge is navy when nav item is inactive; turns red on active. Badge hides at zero (no badge shown when queue is empty).
- User avatar + name + version string at bottom

There is no breadcrumb hierarchy except in Review Queue, where the header reads: `Generate / Review Queue` (prototype line 901–902) to orient Joe that Review Queue is downstream of Generate.

### 2.3 First-Visit Landing

After magic-link authentication:

1. If API keys are not fully configured (TW + HeyGen + Fashn all required), show a yellow welcome banner at the top of Generate: "Welcome — set up your 3 API keys in Settings to start generating. [Go to Settings →]". Banner dismisses permanently once all 3 keys are confirmed.
2. Land on Generate screen regardless.
3. If this is a brand-new install with no prior variants, the bottom strip shows empty state copy (see §3.5).

### 2.4 Routing

Single-page application with hash or history routing. Three routes: `/generate` (default), `/review`, `/settings`. Unrecognized routes redirect to `/generate`. No nested routes in Sprint 1.

---

## 3. Screen 1: Generate

**Purpose:** Joe types a brief, configures it with pattern chips and SKU, and fires off 3 variant renders. The right sidebar gives him contextual TW hook performance data to inform the brief. The bottom strip shows the status of all recent renders so he has operational awareness without leaving this screen.

### 3.1 Layout

Two-column grid (prototype line 163–169):
- Left: compose area (brief form) — fills remaining width
- Right: "Top hooks this week" insights sidebar — fixed 320px
- Below grid: bottom queue strip — full width, fixed to bottom of scrollable area

The compose area and sidebar are top-aligned and do not scroll past the strip. On viewport heights under ~700px, the strip stacks below the grid with a visible border; the grid itself becomes scrollable.

### 3.2 Brief Textarea

- **Label:** None (heading serves as label — see below)
- **Heading above textarea:** "What ad do you want to make?" — 28px, 700 weight, Inter (prototype line 171–175)
- **Placeholder text:** "New ad for navy quarter-zip, problem-solution angle, autumn refresh…" (prototype line 814)
- **Font:** JetBrains Mono 14px (prototype line 183) — the brief is copy. Monospace signals "this is functional text, not prose."
- **Min height:** 96px. Resizable vertically by the user (resize: vertical).
- **Character limit:** 400 hard cap. Counter appears bottom-right of textarea:
  - 0–279 chars: counter hidden
  - 280–349 chars: counter visible, amber color (#9a6700) — "280 / 400"
  - 350–399 chars: counter turns red (#c8102e) — "350 / 400"
  - 400 chars: textarea border turns red, further input blocked, counter reads "400 / 400 — trim your brief"
- **Autofocus:** Yes. Joe lands on Generate and can start typing immediately.
- **Submit on Enter:** No. Textarea is multi-line. Generate button is the submit target.

### 3.3 Pattern Chips

Displayed as a horizontal chip row below the textarea (prototype line 817–824).

- **Options:** Founder Story | Problem-Solution | Limited Drop
- **Behavior:** Single-select (mutex). Exactly one chip must be active at all times. Initial default: no chip pre-selected — the first time, Joe must explicitly choose. On second and subsequent visits, remember the last selection in localStorage.
- **Active state:** Navy fill (#1a3a5c), white text (prototype line 229–232)
- **Hover state:** Light gray background (#f6f8fa), text darkens to #1f2328
- **No chip selected:** Generate button disabled with tooltip "Pick a pattern to continue"

**Design call:** mutex, not multi-select. The Hook Generator takes a single pattern as `{angle}` input (PRD §6.1.2 F-HG-1). Multi-pattern briefs would require a different API contract. Keep chips single-select in Sprint 1.

### 3.4 SKU Picker

- **Label:** "SKU" — 12px, 600 weight, uppercase, letter-spaced (prototype line 207–211)
- **Component:** `<select>` dropdown populated from `products.json` SKU list. On the prototype this works as a native `<select>` (line 827–835). Recommendation: upgrade to a searchable combobox (React `<Combobox>` via Headless UI or Radix) if SKU count exceeds ~15. For Sprint 1, Saltwater has ~12 SKUs — native select is fine.
- **Default:** "Select a SKU…" placeholder option (non-selectable, value = ""). Generate button disabled until SKU is selected.
- **Option format:** "{Product Name} — {Color/Variant}" e.g. "Performance Polo — Navy"
- **Required:** Yes. Generate button disabled without a SKU selected.

### 3.5 Audience Tag

- **Label:** "Audience tag (optional)"
- **Component:** Free-text input, single line
- **Placeholder:** "e.g. Long Island Dads 32–48"
- **Character limit:** 80 chars (no counter; just truncate input at limit)
- **Required:** No. Maps to `audience_tag` in the `brief` table, which is nullable (PRD §6.6).
- **Behavior:** Piped as `audience_tag` into Hook Generator prompt context. If empty, Hook Generator generates for the default "Older Joe DeMarco" archetype from `customer.md`.

### 3.6 Generate Button

- **Label:** "Generate 3 Variants →" (prototype line 841–843)
- **Style:** Full-width, navy fill, 16px, 600 weight. Arrow glyph shifts 2px right on hover (prototype line 277–278).
- **Disabled state:** Gray fill (#c9d1d9), cursor not-allowed. Button is disabled when:
  - No pattern chip selected, OR
  - No SKU selected
- **Loading state:** After Joe clicks, button label changes to "Generating…" with a spinner replacing the arrow. Button remains disabled during submission to prevent double-submit.
- **Post-submit confirmation:** Button returns to enabled after ~2 seconds (hooks are queued). A toast appears: "3 variants queued — check back in 8–12 minutes." (See §7 Microcopy.) The bottom strip immediately shows a new pill with state `queued`, then transitions to `rendering` as the job starts.

### 3.7 Right Sidebar — Top Hooks This Week

This sidebar shows TW Creative Cockpit data: the top 3 hooks ranked by ROAS from the past 7 days (prototype lines 847–870).

- **Heading:** "Top hooks this week" with a small green live-dot (6px, #1a7f37) (prototype line 851–856)
- **Each hook item:** hook text in JetBrains Mono 13px, then a meta row showing product name and ROAS in green monospace
- **TW data freshness:** Header area shows "Last sync from Triple Whale: X min ago" in the main page header (prototype line 808). On-demand sync button lives in Settings, not here.
- **Empty state:** If TW key is not configured or data has never synced: gray placeholder reads "Connect Triple Whale in Settings to see top-performing hooks." No data is invented, no spinner loops.
- **Stale state:** If TW sync is >24 hours old, the live-dot turns amber and a subtitle reads "TW data stale — sync in Settings."
- **Interaction:** Read-only. Joe cannot click a hook to pre-fill the textarea. These are reference data, not copy-paste shortcuts (per approved.json: "TW data is for the AI to use internally, not for Joe to study").

### 3.8 Bottom Queue Strip

A horizontally-scrollable strip at the bottom of the Generate screen showing recent variant pills (prototype lines 874–896).

- **Strip label:** "Recent" — 12px uppercase, muted, flex-shrink: 0 so it doesn't scroll
- **Each pill:** Shows variant name (e.g., "Performance Polo V1") + status pill. Clicking the pill navigates to Review Queue with that variant pre-selected in the master list. This is the primary affordance for Joe to jump from Generate to Review without hunting.
- **Pill sort:** Most recent left-to-right. Max ~8 pills visible before horizontal scroll. No pagination — strip truncates to last 20 variants.
- **Empty state:** Strip label reads "Recent" and a single dimmed pill reads "No variants yet — generate your first one above." Pill is not clickable.
- **Strip is always visible** even when grid is scrolled — it is sticky to the bottom of the main content area.

#### Status Pill States (all surfaces)

| State (DB `variant.status`) | Pill Color | Pill Text | Click Behavior |
|---|---|---|---|
| `queued` | Gray bg, gray text | QUEUED | Deep-link to Review Queue, row highlighted |
| `rendering` | Amber bg (#fff8c5), amber text (#9a6700) | RENDERING | Deep-link; row shows in-progress |
| `ready_for_review` | Green bg (#dcfce7), green text (#1a7f37) | READY | Deep-link; row selected, detail pane opens |
| `approved` | Navy bg (#1a3a5c), white text | APPROVED | Deep-link; row shows approved state |
| `rejected` | Light gray bg, muted text | REJECTED | Deep-link; visible but de-emphasized |
| `failed_recoverable` | Red bg (#ffeef0), red text (#c8102e) | FAILED · RETRY | Deep-link; detail pane shows retry CTA |
| `failed_terminal` | Red bg, red text | FAILED | Deep-link; detail pane shows terminal error |
| `cancelled` | Gray bg, muted text | CANCELLED | Deep-link; informational only |

The prototype uses four states (READY, RENDERING, APPROVED, FAILED · RETRY) covering the visible surface. All eight states map to pills at the DB layer. States `hooks_generating`, `hooks_ready`, `vendor_pending`, `partial`, `assembling` (PRD §6.5 job state machine) are internal job states — they do not surface as user-visible variant status but do drive the rendering pill's animation while active.

### 3.9 Generate Screen States

**Empty state (no variants ever generated):** Brief textarea is pre-filled with a faded placeholder. Bottom strip shows empty-state pill. Right sidebar shows TW empty state if not connected.

**Loading state (post-submit):** Generate button shows spinner. Bottom strip immediately gains a new `queued` pill for the just-submitted brief. No full-page loading state — the form remains editable for the next brief.

**Error state (generation failed at hook step):** Toast appears: "Couldn't generate hooks — check your API keys in Settings." The queued pill transitions to `failed_recoverable`. No destructive wipe of the form.

---

## 4. Screen 2: Review Queue

**Purpose:** Joe reviews finished variants, watches the video, optionally edits the ad caption, acknowledges the AI disclosure requirement, and approves or rejects. This is the final human gate before the ad leaves the system.

### 4.1 Layout

Master-detail layout occupying `calc(100vh - header - strip)` (prototype line 381–383: `height: calc(100vh - 51px - 65px)`):

- **Left panel:** 380px fixed, scrollable variant list
- **Right panel:** Remaining width, scrollable detail pane

The bottom queue strip does NOT appear on the Review Queue screen — its purpose (status awareness) is served by the list panel itself.

### 4.2 Left Panel — Variant List

**List header:** "Pending review" — 14px, 600 weight, sticky at panel top. Header also shows the count: "3 pending" appears in the main page header (prototype line 904).

**Sort order:** `ready_for_review` first (descending created_at), then `approved` (descending), then `rejected`, then `failed`. Rendering variants appear in their natural sort position but show a non-interactive pill. Rationale: Joe's attention should land on actionable items first.

**Each list row** (prototype lines 399–445):
- Left: 36×48px thumbnail (9:16 aspect, ~60px logical height; actual thumbnail is a keyframe screenshot of the rendered video served via signed URL). Placeholder is the navy gradient from the prototype until thumbnail loads.
- Right content area:
  - **Hook text:** First ~40 characters of hook text in JetBrains Mono 12px, single line, ellipsis overflow. (prototype line 427–432)
  - **Brief context:** Pattern + SKU, 11px muted, single line, ellipsis overflow. E.g., "Performance Polo — Navy · Problem-Solution"
  - **Row meta:** Left: age string ("2 min ago", "1 hr ago"). Right: status pill.
- **Selected state:** 3px left border in navy, white background (prototype line 408–412)
- **Hover state:** Light gray background
- **Click:** Selects the row, loads this variant in the detail pane. No page navigation — this is in-pane.

**First load:** First `ready_for_review` variant is auto-selected if present; otherwise no selection and detail pane shows empty state.

### 4.3 Right Panel — Detail Pane (Single-Variant Mode)

**Detail toolbar** (prototype lines 457–484):
- Left: Toggle group — "Detail" | "Compare 3 variants" — segmented control, not tabs
- Right: Context label — "Variant 1 of 3 · Performance Polo — Navy"

**Video player** (prototype lines 487–535):
- 320px wide (desktop), 9:16 aspect ratio — approximately 569px tall
- Navy gradient placeholder background until video loads
- Centered play button (white circle, navy triangle) — clicking loads and plays the signed-URL MP4
- Duration badge bottom-right in JetBrains Mono (e.g., "0:18")
- No autoplay. Joe clicks play deliberately. Video does not loop.
- Signed URL: 1-hour TTL generated per request (PRD §7.7)

**Hook text display** (prototype line 540–545):
- JetBrains Mono 18px, 500 weight — the full hook text, not truncated
- This is read-only display, not editable. The hook is what was rendered into the video; editing it here would create a mismatch with the video.

**Metadata tags** (prototype lines 548–561):
- Pattern chip (e.g., "Problem-Solution"), SKU (e.g., "Performance Polo — Navy"), spec tag ("9:16 · 1080p")
- Gray pill tags, uppercase 11px, read-only

**Primary ad text — inline caption editor:**
- Label: "Primary ad text (editable)"
- Textarea: min-height 80px, resizable, JetBrains Mono replaced with Inter 14px here (this is body copy, not a hook script)
- This field maps to the ad's Meta primary text — the copy Joe will paste into Meta Ads Manager during upload
- **Autosave on blur.** No explicit save button. Autosave debounced at 800ms after last keystroke. A subtle "Saved" checkmark appears momentarily (200ms fade-in, 2s hold, 200ms fade-out) in the top-right of the caption area on successful save.
- **Dirty-edit conflict:** If Joe has unsaved changes in the caption field and then clicks Approve, save is triggered automatically before the approval event is recorded. Approval is not blocked. No dialog.
- Character counter: 125 chars = Meta primary text recommended limit. Counter appears at 90 chars. Amber at 110, red at 125. Exceeding 125 chars is permitted (Meta allows it) but the counter stays red as a reminder.

**AI disclosure gate** (prototype lines 591–612, prototype line 1004–1007):
- Amber background box (#fff8c5), amber border (#d4a017)
- Checkbox + label: "AI-generated content flag. I confirm I will set Meta's AI-generated content flag during upload. (Required before download.)"
- The word "Required" in the label is visually bold and amber-colored.
- Checkbox is unchecked on every page load, every variant load. It does not persist across variants or sessions — Joe must actively check it each time.
- The Approve button (below) is `disabled` and visually grayed out until this checkbox is checked. This is enforced in the component, not just CSS (aria-disabled + disabled attribute).

**Action buttons** (prototype lines 614–669):

| Button | Style | Disabled When | Action |
|---|---|---|---|
| "Approve → Download for Meta" | Navy fill, full flex-1 | AI disclosure unchecked | Logs approval to DB, generates 24hr signed URL for MP4 download, triggers browser download of MP4 + caption text file, shows success toast |
| "Regen with feedback" | Outline border | Never | Opens regen feedback modal (see §4.5) |
| "Reject" | Subtle text button, hover turns red | Never | Transitions variant to `rejected`, removes from pending count, shows toast "Variant rejected." |

The "→" in the Approve button is rendered as a `<span class="red-accent">` in the prototype (line 1013) — a small USA-red arrow glyph. Preserve this in the React implementation.

**Variants with status other than `ready_for_review`:**
- `rendering`: Action buttons hidden. Detail pane shows a progress indicator (see §10 for the full wait UX pattern). Caption editor and disclosure checkbox are hidden.
- `approved`: Caption editor is read-only. Approve button replaced with "Download again" (outline style). Disclosure gate is still present and unchecked (Joe must re-acknowledge for re-download).
- `rejected`: Caption editor is read-only. All action buttons replaced with a single "Restore to review" text button that transitions the variant back to `ready_for_review`.
- `failed_recoverable`: Shows error message + "Retry render" primary button.
- `failed_terminal`: Shows error message, "Retry render" disabled, "Contact support" link (mailto Nick).

### 4.4 Right Panel — Compare Mode (Three-Variant Side-by-Side)

Activated by clicking "Compare 3 variants" in the toolbar toggle. Shows all 3 variants of the selected brief as a 3-column grid (prototype lines 1021–1072).

**When does Compare mode apply?** Compare mode is scoped to the variants of the same `hook_set` (same brief submission). Selecting a variant from the list that belongs to brief B and switching to Compare will show V1/V2/V3 of brief B.

**Each compare card** (prototype lines 1031–1070):
- Scaled-down video frame (width: 100% of column, 9:16 aspect)
- Hook text truncated to ~2 lines in JetBrains Mono 13px
- V1/V2/V3 label + pattern tag
- Compact actions: "Approve" | "Regen" | "Reject" — same semantic actions as single-variant mode, condensed

**AI disclosure in compare mode:** Recommendation — per-card disclosure, not global. Rationale: Joe may approve V1 and reject V2/V3 of the same brief. A global checkbox would be ambiguous about which variants it covers. Each card has its own checkbox above its Approve button. Each Approve is independently disabled until its card's checkbox is checked. This matches the PRD's "every ad ships with... AI-generated content flag" language — the disclosure is per-asset, not per-session.

**Empty compare state:** If a brief has only 1 or 2 rendered variants (partial renders), compare mode shows the available cards and gray placeholder cards for the missing variants with "Rendering…" label.

### 4.5 Regen-with-Feedback Modal

Opens from "Regen with feedback" button. Modal, not inline expansion. Rationale: the detail pane is already dense; a modal keeps the feedback form focused and avoids layout reflow.

**Modal content:**
- Title: "What should be different?"
- Single textarea: plain text, max 400 chars, placeholder "e.g. Make the hook shorter, lean into the dock-life angle more, avoid the word 'stiff'"
- Submit: "Regenerate →" (navy fill)
- Cancel: "Never mind" (text button)

**On submit:** Modal closes. The original variant's status transitions to `rejected` (it is replaced, not updated in-place). A new `queued` variant is created linked to the original brief, with the feedback text appended to the Hook Generator prompt. The new variant appears in the list immediately with `queued` status. Toast: "Regenning — check back in 8–12 minutes."

**Feedback piping:** The free-text feedback is appended to the Hook Generator call as a `regen_note` field. The Hook Generator treats it as a refinement constraint on top of the existing brand bucket context. This is Sprint 1 behavior; Sprint 2 may formalize the feedback loop into the losers JSONL.

### 4.6 Review Queue Empty State

When there are zero variants of any status:
- List panel: Empty state illustration (a simple navy line art icon, not a photograph) + text: "Nothing in queue yet. Generate your first ad on the Generate screen."
- Link: "Go to Generate →" navigates to Generate screen.
- Detail pane: Blank, no content.

### 4.7 Rendering In-Progress State (List Panel)

A `rendering` variant in the list panel:
- Thumbnail area shows an animated shimmer placeholder (CSS skeleton animation)
- Hook text replaced with: "Rendering… (est. 8–12 min)"
- Status pill shows RENDERING (amber)
- Row is not selectable — clicking a rendering row shows the detail pane in rendering state with the wait UX (see §10)

### 4.8 Failed State Microcopy

`failed_recoverable` detail pane:
- Red inline alert box (not a toast): "Render failed — one or more vendor calls timed out."
- Sub-text: "This happens occasionally. Retry usually works."
- Button: "Retry render →" (navy fill)

`failed_terminal` detail pane (after 24 hours in recoverable with no manual retry):
- Red inline alert: "Render permanently failed after 3 attempts."
- Sub-text: "Something is wrong upstream — check HeyGen/Fashn status, then contact Nick."
- "Contact Nick →" is a mailto link to nickd@demarconet.com.
- Retry button is disabled but visible, labeled "Retry unavailable."

---

## 5. Screen 3: Settings

**Purpose:** One-time setup and periodic maintenance. Joe visits Settings to configure API keys on first install and to swap brand bucket files when the catalog or voice evolves. This screen is not in Joe's weekly workflow; it's infrastructure.

### 5.1 Layout

Single-column, max-width 640px, centered in the main content area (prototype line 714–716). No sidebar-within-sidebar. Each sub-section is a card with a heading, a helper paragraph, and a list of rows.

**First-time setup banner:** If any of the three required API keys (TW, HeyGen, Fashn) are not configured, a yellow banner appears at the top of Settings: "3 API keys needed before you can generate ads. Fill them in below." Banner dismisses permanently once all 3 keys are confirmed valid. The same banner appears on the Generate screen pointing here (see §2.3).

### 5.2 API Keys Section

Heading: "API keys"
Helper: "Stored server-side only. This screen shows whether a key exists — never the key value."

**Each key row** (prototype lines 729–765):
- Left: Key name (e.g., "Triple Whale (read-only)")
- Center: Status indicator — green dot + "Configured · rotated X days ago" or red dot + "Not configured"
- Right: "Update" button (if configured) or "Add" button (if not)

**Keys shown in Sprint 1:**
| Key Name | Required | Sprint |
|---|---|---|
| Triple Whale (read-only) | Yes | 1 |
| HeyGen Team | Yes | 1 |
| Fashn.ai Pro | Yes | 1 |
| Higgsfield Creator | No | Sprint 2 — row shown as "Sprint 2" label, no Add button |
| Meta Ads Manager | No | Sprint 2 — same treatment |

**Update/Add flow:**
1. Joe clicks "Update" or "Add." A two-field inline form expands below the row (not a modal — inline keeps context).
2. Fields: "Current key" (masked, shows only if key already exists — label "Current: ••••••••ab3f") and "New key" (password input, visible toggle).
3. "Save" button submits. Server calls the vendor's identity endpoint to validate the new key before storing it. (E.g., HeyGen: `GET /v2/user` with the new bearer token. TW: `GET /api/v2/attribution/summary` with the API key header. Fashn: `GET /v1/account` or equivalent.)
4. On validation success: row updates to "Configured · rotated just now." Inline form collapses.
5. On validation failure: inline error below the "New key" field: "That key didn't validate — double check it." Form stays open. Old key is NOT replaced.
6. "Cancel" collapses the form with no changes.

**Security note (developer implementation):** The "Current key" display must never return the actual key value from the server. The server returns only a masked suffix (last 4 chars + asterisks) or "configured / not configured" boolean. PRD §7.7 is explicit: "Settings screen reads secret existence (boolean) but never returns secret values to the browser."

### 5.3 Brand Bucket Section

Heading: "Brand bucket"
Helper: "Voice, customer profile, products, and performance history. Each file is versioned — changes take effect on the next generation."

**Files shown:**
| File | Description | Sprint 1 Actions |
|---|---|---|
| `voice.md` | Brand voice rules, vocabulary, anti-patterns | Upload new version |
| `customer.md` | AI catalog model archetype | Upload new version |
| `products.json` | SKU catalog (12 SKUs) | Upload new version |
| `hooks-winners.jsonl` | Performance-validated winning hooks | View only (auto-managed) |

**Each file row:**
- Left: Filename
- Center: "Last updated X days ago" + for `products.json`: SKU count ("12 SKUs"); for `hooks-winners.jsonl`: entry count + earn-it note ("3 entries · earn-it gate at 30")
- Right: "Update" button (upload files) or "View" button (view-only files)

**Upload flow (Update):**
1. Joe clicks "Update." A file picker opens (drag-drop zone + browse button).
2. Accept: `.md` for voice/customer, `.json` for products, `.jsonl` for hooks.
3. For `products.json`: server validates JSON structure before accepting. If malformed (invalid JSON, missing required fields): inline error "products.json is invalid — fix the JSON and try again." Upload is rejected.
4. On success: row shows "Last updated just now" + new SHA-256 short hash (first 8 chars, e.g., "sha: 3a7f9c1b") in a monospace caption. This confirms to Joe (or Nick debugging) exactly which version is active.
5. No preview of file contents in v1. Files are opaque blobs from the UI perspective.

**hooks-winners.jsonl** is append-only (auto-managed by the Hook Generator feedback loop). Joe cannot upload to it; "View" opens a read-only table of the last 50 entries: `{hook_text, pattern, sku_id, roas, logged_at}` columns. If empty: "No winning hooks yet — they're added automatically as your ads perform."

### 5.4 Default Config Section

Heading: "Render defaults"
Helper: "Fixed for Sprint 1 — no changes needed."

Display-only rows (no edit controls):
- **Output format:** 9:16 · 1080p MP4 (Meta primary)
- **Audio loudness:** -16 LUFS (Meta spec)
- **Variants per brief:** 3

These are locked per PRD §7.4. Display them to inform Joe they are intentional decisions, not gaps. No edit UI in Sprint 1.

### 5.5 Account Section

Heading: "Account"
Helper: "Magic-link authentication — no password."

- Email address display: "Logged in as joe@saltwaterclothingco.com"
- "Sign out" text button — ends session, redirects to magic-link request screen
- "Invite Buddy" row: grayed out, label "Buddy preview-link (Sprint 2)" — visible as a coming-soon item so Joe knows it's planned. Not clickable.

### 5.6 Audit Log Section

Heading: "Audit log"
Helper: "Last 100 operator actions."

A read-only table: `{timestamp, operator email, action, target}`. E.g.:
- `2026-04-30 09:14 | joe@saltwater... | approved | variant_id: 47`
- `2026-04-30 09:10 | joe@saltwater... | generated | brief_id: 23`
- `2026-04-30 08:55 | nick@demarco... | updated_key | heygen`

Table is paginated at 25 rows per page with "Load more" at bottom. No search in Sprint 1. If no entries: "No activity yet."

This section is primarily for Nick's debugging use. Joe will never scroll here unless something breaks.

### 5.7 TW Sync Button

Placed as a small "Sync now →" text button in the API Keys section, below the TW key row. Joe clicks it to trigger an on-demand TW data pull (PRD §6.1.3 F-TW-3). Button shows a spinner during sync ("Syncing…"), then confirmation ("Synced just now") or error ("TW sync failed — check your key."). Sprint 2 makes this automatic hourly.

---

## 6. Component Inventory

Every reusable React component for the developer's implementation hit list. Props shown as TypeScript signatures where the shape matters.

| Component | File | Role |
|---|---|---|
| `<AppShell>` | `AppShell.tsx` | Root layout: sidebar + main area grid |
| `<Sidebar>` | `Sidebar.tsx` | 220px nav column with brand mark, nav items, user footer |
| `<NavItem active? badge?>` | `NavItem.tsx` | Single sidebar nav row; accepts badge count prop |
| `<MainHeader breadcrumb? meta?>` | `MainHeader.tsx` | Sticky page header bar with breadcrumb + right meta slot |
| `<BriefTextarea value onChange charLimit>` | `BriefTextarea.tsx` | JetBrains Mono textarea with char counter states |
| `<PatternChipGroup value onChange>` | `PatternChipGroup.tsx` | Mutex chip row for Founder Story / Problem-Solution / Limited Drop |
| `<Chip label active onClick>` | `Chip.tsx` | Single pill chip; used in PatternChipGroup and detail pane tags |
| `<SkuPicker options value onChange>` | `SkuPicker.tsx` | Native select (v1) or combobox (>15 SKUs); wraps Radix Select |
| `<AudienceTagInput value onChange>` | `AudienceTagInput.tsx` | Plain text input, 80-char limit |
| `<GenerateButton disabled loading onClick>` | `GenerateButton.tsx` | Full-width navy CTA with arrow glyph + spinner state |
| `<TopHooksSidebar hooks? loading staleAt?>` | `TopHooksSidebar.tsx` | TW insights panel; handles empty / stale states |
| `<HookItem hookText product roas>` | `HookItem.tsx` | Single TW hook entry row with ROAS badge |
| `<QueueStrip variants>` | `QueueStrip.tsx` | Horizontal scrollable bottom strip on Generate screen |
| `<QueuePill variant onClick>` | `QueuePill.tsx` | Single status pill in the strip; navigates to Review on click |
| `<StatusPill state>` | `StatusPill.tsx` | Reusable pill for any surface; maps DB state → color + label |
| `<ReviewLayout>` | `ReviewLayout.tsx` | Master-detail grid wrapper for Review Queue screen |
| `<VariantList variants selectedId onSelect>` | `VariantList.tsx` | Scrollable left panel with sort logic built in |
| `<VariantRow variant selected onClick>` | `VariantRow.tsx` | Single list row: thumb + hook + context + age + pill |
| `<VariantThumbnail src loading>` | `VariantThumbnail.tsx` | 36×48px thumbnail with skeleton shimmer fallback |
| `<DetailPane variant mode onModeChange>` | `DetailPane.tsx` | Right panel; delegates to SingleVariant or CompareGrid based on mode |
| `<ModeToggle mode onChange>` | `ModeToggle.tsx` | "Detail / Compare 3 variants" segmented control |
| `<VideoPlayer src duration loading>` | `VideoPlayer.tsx` | 9:16 video frame with play button, duration badge, signed URL handling |
| `<HookDisplay text>` | `HookDisplay.tsx` | Full hook text in JetBrains Mono 18px, read-only |
| `<MetaTagRow pattern sku spec>` | `MetaTagRow.tsx` | Row of gray pill tags below hook text |
| `<CaptionEditor value onChange onSave>` | `CaptionEditor.tsx` | Textarea with autosave-on-blur, char counter, "Saved" indicator |
| `<AiDisclosureGate checked onChange>` | `AiDisclosureGate.tsx` | Amber checkbox block; exports checked state to parent |
| `<ActionBar variant disclosureChecked>` | `ActionBar.tsx` | Approve + Regen + Reject button row with disabled logic |
| `<RegenModal open onSubmit onCancel>` | `RegenModal.tsx` | Feedback textarea modal; plain text, 400-char limit |
| `<CompareGrid variants>` | `CompareGrid.tsx` | 3-column side-by-side card grid |
| `<VariantCard variant compareMode>` | `VariantCard.tsx` | Card used in CompareGrid: scaled video + hook + compact actions |
| `<SettingsSection title helper>` | `SettingsSection.tsx` | Section wrapper with heading + helper text |
| `<ApiKeyRow name status lastRotated>` | `ApiKeyRow.tsx` | Key row with status dot, Update/Add button, inline expand form |
| `<ApiKeyUpdateForm name onSave onCancel>` | `ApiKeyUpdateForm.tsx` | Inline expand: current masked + new key fields + Save/Cancel |
| `<BrandBucketRow file status meta>` | `BrandBucketRow.tsx` | File row with last-updated, SHA hash, Update/View button |
| `<FileUploader accept onUpload>` | `FileUploader.tsx` | Drag-drop + browse zone; validates products.json on client before upload |
| `<AuditLogTable events>` | `AuditLogTable.tsx` | Read-only paginated table of audit log events |
| `<Toast message type duration>` | `Toast.tsx` | Ephemeral notification; types: success / error / info |
| `<InlineAlert message type>` | `InlineAlert.tsx` | Persistent inline alert box; types: error / warning / info |
| `<WelcomeBanner onDismiss>` | `WelcomeBanner.tsx` | First-time setup yellow banner; dismisses once all keys configured |
| `<EmptyState icon headline cta?>` | `EmptyState.tsx` | Reusable empty/error state block for any screen |
| `<WaitIndicator jobId stage eta?>` | `WaitIndicator.tsx` | Render progress for the 8–12 min wait (see §10) |

---

## 7. Microcopy Library

Voice: direct, slightly coastal, never corporate. Joe reads these. Write like you're texting him, not filing a bug report.

### 7.1 Buttons and CTAs

| Context | Copy |
|---|---|
| Generate CTA | "Generate 3 Variants →" |
| Generate loading | "Generating…" |
| Approve primary | "Approve → Download for Meta" |
| Approve (re-download) | "Download again" |
| Regen secondary | "Regen with feedback" |
| Reject tertiary | "Reject" |
| Retry on recoverable fail | "Retry render →" |
| Restore rejected variant | "Restore to review" |
| Regen modal submit | "Regenerate →" |
| Regen modal cancel | "Never mind" |
| Settings: key configured | "Update" |
| Settings: key missing | "Add" |
| Settings: TW sync | "Sync now →" |
| Settings: hooks view | "View" |
| Settings: brand file | "Update" |
| Settings: sign out | "Sign out" |

### 7.2 Status Pills

| State | Pill Text |
|---|---|
| queued | QUEUED |
| rendering | RENDERING |
| ready_for_review | READY |
| approved | APPROVED |
| rejected | REJECTED |
| failed_recoverable | FAILED · RETRY |
| failed_terminal | FAILED |
| cancelled | CANCELLED |

### 7.3 Toasts (ephemeral, ~3 seconds)

| Trigger | Toast Copy | Type |
|---|---|---|
| Generate submitted | "3 variants queued — check back in 8–12 minutes." | Info |
| Variant approved | "Approved. Downloading now." | Success |
| Variant rejected | "Variant rejected." | Info |
| Regen submitted | "Regenning — check back in 8–12 minutes." | Info |
| Caption autosaved | (No toast — inline "Saved" indicator in caption field) | — |
| TW sync success | "Triple Whale synced." | Success |
| TW sync failed | "TW sync failed — check your key in Settings." | Error |
| API key saved | "Key saved and validated." | Success |
| API key validation failed | "That key didn't validate — double check it." | Error |
| File uploaded | "voice.md updated." (filename dynamic) | Success |
| products.json malformed | "products.json is invalid — fix the JSON and try again." | Error |

### 7.4 Empty States

| Screen / Context | Headline | Sub-text | CTA |
|---|---|---|---|
| Generate — bottom strip, no variants | "No variants yet" | "Generate your first ad above." | — |
| Generate — TW sidebar, no key | "No TW data" | "Connect Triple Whale in Settings to see top-performing hooks." | "Go to Settings →" |
| Generate — TW sidebar, stale | "TW data is stale" | "Last synced over 24 hours ago — sync in Settings." | "Sync now →" |
| Review Queue — no variants ever | "Nothing in queue yet" | "Generate your first ad on the Generate screen." | "Go to Generate →" |
| Review Queue — all variants resolved | "Queue is clear" | "All variants have been approved or rejected. Generate more above." | "Go to Generate →" |
| Audit log — no events | "No activity yet" | "Events appear here as you use the app." | — |
| hooks-winners.jsonl — no entries | "No winning hooks yet" | "They're added automatically as your ads perform in Meta." | — |

### 7.5 Error Messages

| Error | User-facing message |
|---|---|
| Hook generation failed | "Couldn't generate hooks — check your API keys in Settings." |
| Render failed (recoverable) | "Render failed — one or more vendor calls timed out. This happens occasionally. Retry usually works." |
| Render failed (terminal) | "Render permanently failed after 3 attempts. Something is wrong upstream — check HeyGen/Fashn status, then contact Nick." |
| Download failed | "Download failed — try again." |
| Session expired | "Your session expired. We'll send you a new magic link." |
| TW API down | "Triple Whale is unreachable. Ads will generate from brand bucket only — TW data won't prime this batch." |
| products.json invalid | "products.json is invalid — fix the JSON and try again." |
| API key validation failure | "That key didn't validate — double check it." |

### 7.6 AI Disclosure Label

"AI-generated content flag. I confirm I will set Meta's AI-generated content flag during upload. (Required before download.)"

The word "Required" is bold and amber-colored in both the detail pane and compare-mode cards.

### 7.7 Wait Copy (inline, not toast)

On a rendering variant detail pane: "This ad is being rendered — usually takes 8–12 minutes. We'll have it ready in your queue when it's done." Below that, a vendor-stage label updates as the job progresses (see §10).

---

## 8. Accessibility

### 8.1 WCAG Target

Level AA. Sprint 1 ships AA-compliant. AAA is not required.

### 8.2 Color Contrast Checks

| Combination | Ratio | Grade |
|---|---|---|
| Navy #1a3a5c on white #ffffff | 10.6:1 | AAA |
| White on navy #1a3a5c | 10.6:1 | AAA |
| Red #c8102e on white #ffffff | 5.1:1 | AA (large text: AAA) |
| Amber text #9a6700 on white | 4.6:1 | AA |
| Muted text #656d76 on white | 4.5:1 | AA (border case — use sparingly for labels, never for body copy) |
| Green #1a7f37 on white | 4.8:1 | AA |
| Navy text on sand bg #f5f0e8 | ~9.5:1 | AAA |

Red #c8102e on white passes AA for normal text (≥4.5:1) and AAA for large text (≥3:1). Do not use red text at 12px or below on white — it narrows to a borderline pass. Muted gray #656d76 is a borderline AA — use it only for decorative labels (PATTERN chip text, breadcrumb separators), never for functional information.

Color is never the sole indicator of status. Every status pill includes a text label alongside the color (e.g., READY, RENDERING). Screen readers read the label. The AI disclosure "Required" indicator is text-labeled, not just amber-colored.

### 8.3 Keyboard Navigation Order

**Generate screen:**
1. Skip-to-main-content link (visually hidden, appears on focus)
2. Sidebar: brand mark (not focusable), nav items (Generate, Review Queue, Settings — Tab order)
3. Main: brief textarea (autofocused on load)
4. Pattern chip row — each chip is a `<button>`, Tab moves through them
5. SKU picker
6. Audience tag input
7. Generate button
8. Bottom strip: each queue pill is a `<button>` in Tab order

**Review Queue screen:**
1. Skip-to-main-content
2. Sidebar nav items
3. List panel: header (not focusable), variant rows (`<button>` or `role="option"` pattern)
4. Detail pane: mode toggle buttons (Detail / Compare 3 variants)
5. Video player play button
6. Caption textarea
7. AI disclosure checkbox
8. Action buttons: Approve, Regen with feedback, Reject
9. In Compare mode: card-by-card left-to-right, each card's disclosure checkbox then Approve then Regen then Reject

**Settings screen:**
1. Skip-to-main-content
2. Sidebar nav
3. Each settings section: rows Tab through key row controls (Update/Add buttons), then inline form fields if open

### 8.4 Focus Management

- **Modal open (Regen feedback modal):** Focus moves to the modal's first focusable element (the feedback textarea). Focus is trapped within the modal — Tab cycles through textarea → Regenerate button → Never mind button → back to textarea.
- **Modal close:** Focus returns to the "Regen with feedback" button that opened it.
- **Inline form expand (API key update):** Focus moves to the "New key" field on expand. On cancel or save, focus returns to the Update/Add button.
- **Variant row selection:** Selecting a variant row moves focus to the detail pane's first interactive element (video play button or caption field). This allows keyboard users to proceed directly to review without a Tab detour back to the list.

### 8.5 Screen Reader Labels

- `<StatusPill state="rendering">` renders `<span aria-label="Status: Rendering">RENDERING</span>`. The visible text is uppercase for style; screen readers get the natural-case aria-label.
- Video player: `<button aria-label="Play ad variant [hook text first 20 chars]">`. Hook text is truncated in the aria-label so screen readers announce something meaningful.
- AI disclosure checkbox: `<input type="checkbox" aria-describedby="ai-disclosure-description">`. The amber box text is the `describedby` target.
- Approve button when disabled: `aria-disabled="true"` + `aria-describedby="disclosure-required-hint"`. Hint text: "Check the AI disclosure box above to enable download."
- Queue strip pills: `<button aria-label="[Variant name], status [state], click to review">`.
- Live regions: when a new variant appears in the queue strip, announce it: `aria-live="polite"` region reads "[Variant name] is ready for review." This fires when status transitions to `ready_for_review`.

### 8.6 prefers-reduced-motion

All CSS animations and transitions check `@media (prefers-reduced-motion: reduce)`:
- Status pill skeleton shimmer animation: disabled. Replace with static gray background.
- Chip hover/active transitions (150ms): disabled. Instant state change.
- Button arrow hover shift: disabled.
- Toast slide-in animation: replaced with instant appear/disappear.
- "Saved" indicator fade on caption autosave: replaced with instant show/hide.
- WaitIndicator ambient animation (see §10): replaced with static progress bar.

---

## 9. Responsive Behavior

**Design call: desktop-first, mobile for status checks only.** Joe runs Saltwater's paid social from a laptop. He opens the app to generate, review, and approve — all from a desk. He may glance at the app from his phone to check render status. The mobile experience must not break; it does not need to match desktop fidelity.

### 9.1 Breakpoints

| Name | Width | Target |
|---|---|---|
| Desktop | ≥ 1024px | Joe's laptop — primary |
| Tablet | 768–1023px | iPad / compact laptop — functional |
| Mobile | < 768px | Phone — status checks only |

### 9.2 Sidebar

- **Desktop (≥1024px):** Fixed 220px left sidebar, always visible.
- **Tablet (768–1023px):** Sidebar collapses to icon-only (48px wide). Nav item labels hidden; icons remain. Tooltip on hover shows the label.
- **Mobile (<768px):** Sidebar hidden. A hamburger button in the top-left of the header opens a slide-in drawer. Drawer closes on nav item tap or tap-outside.

### 9.3 Generate Screen

- **Desktop:** Two-column grid (brief form + TW sidebar). Bottom strip horizontal.
- **Tablet:** Same two-column grid. TW sidebar may be tighter but remains visible.
- **Mobile:** Single-column. TW sidebar collapses into an accordion ("Top hooks this week" — tap to expand). Bottom strip becomes a horizontal swipeable carousel (overflow-x: scroll, snap-type: x mandatory). Pattern chips wrap to two rows if needed. Generate button remains full-width.

### 9.4 Review Queue Screen

- **Desktop:** Master-detail side-by-side (380px list + remaining detail).
- **Tablet (768–1023px):** Master-detail maintained but list column narrows to ~280px. Video player scales down to fit remaining width.
- **Mobile (<768px):** **Collapse to list-only.** Tapping a variant row pushes the detail pane full-screen (covers the list). A back button ("← Queue") in the detail pane header returns to the list. This is standard iOS/Android master-detail pattern. No side-by-side on mobile — the 9:16 video requires most of the screen width to be useful.
  - Compare mode is disabled on mobile. "Compare 3 variants" toggle is hidden. Rationale: three 9:16 videos on a phone screen would be unusable. Joe is not approving ads on his phone; he is checking status.
  - AI disclosure checkbox and Approve button are present in mobile detail view. Joe can approve from mobile if he wants.

### 9.5 Settings Screen

- **All breakpoints:** Single-column layout already — no change. Max-width 640px centers on desktop, flows to full-width on tablet/mobile.

### 9.6 Typography Scale Adjustment

No per-breakpoint font size changes in Sprint 1. The Inter 15px base is readable on all screen sizes. JetBrains Mono 14px in the brief textarea and 12px in list rows is fine on desktop; on mobile the brief textarea inherits 15px to prevent iOS auto-zoom on input focus (iOS zooms in on inputs with font-size < 16px — set min 16px on all mobile inputs).

---

## 10. Loading and Wait UX Patterns

Renders take 8–12 minutes. The UX must be honest about this without creating anxiety. The core principle: **give Joe a progress signal that matches real vendor stages, then get out of his way.** He doesn't need to stare at a progress bar. He needs to know things are moving.

### 10.1 Vendor Stage Labels

The job state machine (PRD §6.5) maps to human-readable stage labels:

| Internal State | Wait Indicator Label |
|---|---|
| `queued` | "In queue…" |
| `hooks_generating` | "Writing hooks…" |
| `hooks_ready` | "Hooks ready — starting render" |
| `vendor_pending` | "HeyGen rendering… / Fashn rendering…" (parallel — show both) |
| `partial` | "Stitching footage…" |
| `assembling` | "Assembling final video…" |
| `ready_for_review` | Complete — show READY pill, play bell or tab notification |

**Estimated time display:** Show a static "~8–12 min" on job creation and update to "~X min remaining" only if the backend can provide a reliable estimate (vendor progress webhooks). In Sprint 1, assume no vendor progress webhooks — show elapsed time instead: "Rendering · 3 min elapsed." This is honest: it tells Joe how long it's been without promising how long is left.

### 10.2 WaitIndicator Component

Used in two places: the Review Queue detail pane (for a selected rendering variant) and as an overlay on a rendering row in the list panel.

**Layout:**
- A thin progress bar at the top of the wait area. The bar is animated with a pulsing shimmer (left-to-right, 2s loop) — it does not advance based on percent complete, because percent complete is not available from vendors. The shimmer signals "alive and working."
- Below the bar: current vendor stage label in muted 13px text.
- Below that: elapsed time in JetBrains Mono 12px — "3 min elapsed."
- Below that (always visible): "This usually takes 8–12 minutes. You don't need to stay on this page." — 13px, muted.

**Optional email-on-completion toggle:** A simple toggle below the wait copy: "Notify me by email when done" — defaults to off. If toggled on, the server sends a transactional email to the logged-in operator's email when the job reaches `ready_for_review`. Email subject: "Your ad is ready — [Brief hook excerpt]". This is a low-effort feature (one sendgrid / SES call in the job completion handler) that meaningfully reduces time-on-site. Recommend implementing in Sprint 1.

### 10.3 Queue Strip Ambient Animation

In the Generate screen bottom strip, a `rendering` pill displays a subtle pulsing opacity animation (0.6 → 1.0 → 0.6, 1.5s loop) on the RENDERING label text. This ambient signal lets Joe see at a glance that something is live without reading the label. No spinner — a spinner implies action is needed. A pulse implies the system is working autonomously.

### 10.4 Long-Wait State (>12 minutes elapsed)

If a job is still in `vendor_pending` or `partial` after 12 minutes (the hard job deadline is 15 min per PRD §6.5), the WaitIndicator transitions:

- Progress bar shimmer stops. Bar fills with a static amber fill.
- Stage label changes to "Taking longer than expected…"
- A new inline alert appears (amber): "This is taking longer than usual. If it doesn't resolve in a few minutes, retry from the Review Queue."
- Retry button becomes visible (disabled — greyed — until 15 minutes have elapsed, then enabled).

### 10.5 Notification Pattern (Tab / Browser)

When a job completes (any tab in any state of focus):
- Browser tab title changes from "Saltwater AI Ads" to "(1) Saltwater AI Ads" (pending count prefix — mirrors the nav badge count).
- If the Notification API is granted, a browser notification fires: "Ready: [hook excerpt]."
- Tab title reverts when Joe navigates to Review Queue and the pending count drops to zero.
- Do not request notification permission on first load — request it the first time Joe submits a generation, in context: "Want a desktop notification when your ad is ready?" with Allow / Skip buttons. If Skip, never ask again (localStorage flag).

### 10.6 "This takes time" Inline Copy

The Generate screen brief form includes a single muted line below the Generate button, always visible: "Renders take 8–12 minutes — you'll see the status below." This sets expectations before Joe ever submits. He is never surprised by the wait because the UI told him before he clicked.

---

## 11. What's Deferred (Explicit Scope Fence)

The following features are intentionally excluded from Sprint 1. Each has a one-line rationale and target sprint.

| Feature | Why Deferred | Target |
|---|---|---|
| **Buddy preview-link** | Joe forwards MP4 by text/email in Sprint 1. Build the signed-URL preview screen only when Buddy explicitly asks for it. | Sprint 2 |
| **Performance digest (in-app)** | Joe reads TW Creative Cockpit directly. An in-app weekly digest requires TW data normalization that doesn't exist yet, and Joe hasn't asked for it. | Sprint 3 |
| **Brand bucket UI editor** | File upload in Settings is sufficient. A full WYSIWYG editor for `voice.md` / `customer.md` adds scope with no validated user pull. | Sprint 3+ |
| **Dashboard hit-rate trend** | No performance data to display in Sprint 1. Hit-rate chart requires ≥1 month of TW-linked results. Joe has TW already. | Sprint 2 or 3 |
| **Higgsfield in-app trigger** | Higgsfield deferred to Sprint 2+ per PRD §6.1.4 F-RO-5. No Settings entry, no manual trigger, no layer in the render pipeline. | Sprint 2 |
| **Decay detector alerts** | Requires daily TW sync + per-ad hook rate history. Decay threshold detection is PRD F-TW-5 flagged Sprint 2. | Sprint 2 |
| **Meta auto-publish (Meta Pusher)** | Sprint 2 per PRD §6.1.6. Sprint 1: Joe downloads MP4, uploads manually to Meta. | Sprint 2 |
| **Hourly TW sync (scheduled)** | On-demand sync only in Sprint 1. Cron scheduler adds infra complexity without clear Sprint 1 need. | Sprint 2 |
| **Multi-job concurrency** | Sprint 1 runs jobs sequentially (one at a time). Parallel multi-job execution deferred per PRD §7.2. | Sprint 2 |
| **Google Search / PMAX copy** | Descoped in PRD revision 2026-04-30. Meta video is the only active Saltwater channel. | Sprint 3+ |
| **1:1 and 16:9 secondary outputs** | 9:16 only in Sprint 1. Secondary formats added when Meta feed + YouTube PMAX are in scope. | Sprint 2 |
| **Veronica founder-couple template** | Pattern exists in brand bucket but the web app has no dedicated template flow for couple ads in Sprint 1. Joe writes the brief manually. | Sprint 2 |

---

## 12. Open UX Questions

Genuine open questions requiring a decision before or during Sprint 1 implementation. Not invented for completeness — these are blockers or early choices that will shape code.

### Q1: Show estimated render time before Joe submits?

The Generate button could display a badge next to it: "~9 min per variant" to prime expectations before submit. Alternatively, the always-visible muted line below the button (§10.6: "Renders take 8–12 minutes") handles this without a per-submit estimate badge. The per-submit badge would be more dynamic (update if TW data shows the pipeline is faster today) but requires the backend to expose an estimate endpoint.

**Recommendation:** Start with the static line ("Renders take 8–12 minutes"). Only add a per-submit estimate if Joe asks "how long will this take?" enough times that it becomes a support pattern.

### Q2: Does "Regen with feedback" create a new variant in the queue or replace the original?

The spec (§4.5) says: the original is transitioned to `rejected` and a new `queued` variant is created. This means Joe's list will accumulate rejected variants over time. An alternative: hide rejected-via-regen variants from the list by default (only show them under a "Show rejected" filter toggle).

**Decision needed:** Does Joe want to see the "failed attempt" variants in the list (useful for comparison) or should they be hidden by default to keep the queue clean? Recommend surfacing this question to Joe during Sprint 1 demo week. Default to hidden until he asks to see them.

### Q3: Should the caption editor use JetBrains Mono or Inter?

The brief textarea uses JetBrains Mono (it's a functional input, code-like). The caption editor (Meta primary ad copy) is prose. The prototype uses the default inherit font for the caption textarea, which resolves to Inter. Using Inter for the caption editor is the right call — it's ad copy, not a brief. But the hook text display above it uses JetBrains Mono. The typographic contrast is intentional: hook = script; caption = prose.

**Recommendation:** Caption editor uses Inter 14px. This is already the behavior in the prototype (caption-edit class inherits from body). Just confirm it is not accidentally overridden in the Tailwind component.

### Q4: How does the list panel handle >20 variants?

The spec says "last 20 variants" in the queue strip on Generate (§3.8). The Review Queue list has no stated limit. With 40–60 variants/month at production velocity, Joe could accumulate 150+ variants after 3 months. The list needs either pagination or a filter/sort bar.

**Recommendation for Sprint 1:** Show all variants in reverse-created order (sort pending first per §4.2). Implement virtual scrolling (react-virtual or TanStack Virtual) in the VariantList component from the start — avoids a painful retrofit later. Add a "pending only" filter toggle above the list (checkbox: "Show only pending") as a low-effort scope control that defers full filter UI to Sprint 2.

### Q5: What happens to the AI disclosure checkbox state between variants?

The checkbox is unchecked on every variant load (§4.3). This means Joe checks the box once per variant. If Joe is approving 5 variants in a session, he checks the box 5 times. Is this the right friction level?

**The right answer is yes.** The disclosure is per-asset, not per-session. Each check-and-approve is a discrete decision for a distinct downloadable file. The friction is the point — it prevents Joe from accidentally publishing AI content without setting the Meta flag because he bulk-approved a queue. Do not add a "check all" batch disclosure. Maintain per-variant acknowledgment.
