# AGENTS — Coordination notes for "The Message in the Machine"

Multiple agents may work in this project and its wiki mirror at the same time. Read this before editing
anything here or in `~/Workspaces/wiki/teams/youtube-content/message-in-the-machine/`.

## 1. DO NOT strip the image embeds from the storyboard

The review storyboard at **`~/Workspaces/wiki/teams/youtube-content/message-in-the-machine/storyboard.md`**
contains Obsidian image embeds — lines of the form `![[pXX-....png]]` placed under each page's
`**image:**` line. These are Nick's visual review surface in Obsidian. **They must stay.**

- If you run a linter, formatter, or a project→wiki sync, make sure it PRESERVES `![[...]]` embed lines.
  A previous pass stripped all 27 embeds while leaving the `**image:**` reference lines — that broke
  Nick's review and had to be rebuilt.
- The embedded images live in `wiki/.../message-in-the-machine/body-v2/`. Obsidian resolves `![[name.png]]`
  by filename across the vault.
- If embeds ever go missing, restore them with:
  `python3 teams/youtube-content/projects/message-in-the-machine/scripts/readd_storyboard_embeds.py`
- Do not edit the storyboard with a tool that rewrites the whole file unless it keeps the embeds.

## 2. Image assets — who owns what (don't overwrite each other)

| Folder | Contents | Rule |
|---|---|---|
| `assets/images/generated-storybook/` | The LOCKED warm-painterly animated body (P4–P32). | Do not overwrite/delete. Owned by the video render work. |
| `assets/images/real/` | Nick's REAL photos — TRS-80 PROM-dump (P14, P17) **and the real images for the ENDING** (museum close P33–35, TRS-80 inserts, InfoAge handout images). | If you are adding/moving real images for the ending, ADD new files; do not delete or rename existing ones. Coordinate the close (P33–35) here. |
| `assets/images/generated/` | v1 photoreal images, now used only as placeholders for the intro (1–3) and exit (33–35) until real footage lands. | Safe to leave as-is. |

The **ending (P33–35) uses real images**. If another agent is sourcing/placing those, that's expected —
just don't touch the storybook body or strip the storyboard embeds while doing it.

## 3. Git hygiene (per repo CLAUDE.md)

- Commit ONLY files you changed this session. Use `git add <specific-paths>` — NEVER `git add -A`/`git add .`.
- Never `git reset --hard`, `git checkout .`, `git clean -fd`, or `git stash` — they destroy other agents' work.

## 4. Current state (2026-06-30)

- Animated body P4–P32 rendered (warm painterly). Bootlegger (P28) face is intentionally hidden — do not "fix" it.
- Intro (Segment 1) = live HeyGen (pending). Exit P33–35 = real images (pending Nick's shoot).
- Audio: pages 6–7 just re-recorded; `episode-vo.mp3` is now 7:02.9. Video re-assemble pending Nick's audio OK.
