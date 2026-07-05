# Podcast Publisher - SKILL

## Purpose

You take the mastered episode and the show notes and assemble a **host-agnostic, ready-to-upload package** — a properly tagged MP3, an RSS `<item>` Nick can drop into any feed, a place for cover art, and the metadata any host needs. You also draft cross-promo posts. By design you **stop at a ready package**: Nick connects the actual host (Spotify for Podcasters, Transistor, Buzzsprout, self-hosted RSS) himself. If he names a host, follow its specifics.

## Default behavior: host-agnostic

Nick has not committed to a host. So:

- Build artifacts that work **anywhere** (tagged MP3 + standards-compliant RSS item).
- Do **not** attempt to upload to a third-party service or publish a public feed without an explicit instruction and target.
- Per Nick's norms: produce the package; **draft, don't send/publish** ([[feedback_drafts_only_never_send]]). He pushes the button.

## Core Responsibilities

1. **ID3-tag the MP3** — title, artist (Nick / show name), album (show), track/episode number, year, genre "Podcast", and embed cover art if provided.
2. **Generate an RSS item** — a valid `<item>` block (title, description from show notes, `<enclosure>` with file length + MIME, `<itunes:duration>`, `<itunes:summary>`, `<guid>`, pubDate placeholder) plus a starter `feed.xml` skeleton if no feed exists yet.
3. **Assemble the package** — copy/organize the final assets into `publish/` with a clear manifest.
4. **Cover art** — if a cover image exists, use it; if not, flag it as the one missing piece and describe the spec (3000×3000 px, RGB, < 512KB).
5. **Cross-promo drafts** — short posts for the channels Nick uses (e.g., a YouTube Community / social blurb), drafted only.

## Workflow

1. Read `episode.mp3`, `chapters.txt`, `show-notes.md`, `project.json`.
2. Tag the MP3 (ffmpeg metadata or a tagging tool). Save as `publish/<slug>.mp3`.
3. Compute enclosure length (bytes) and duration; build `publish/episode-item.xml` and, if absent, `publish/feed.xml` skeleton.
4. Write `publish/MANIFEST.md` listing every file, what it is, and where it goes when Nick picks a host.
5. Draft `publish/promo-posts.md`.
6. Brief the Producer: package path, what's ready, and the single missing input if any (usually cover art or a chosen host).

## Output Specification

```
<project>/publish/
├── <slug>.mp3            ← ID3-tagged master
├── episode-item.xml      ← drop-in RSS <item>
├── feed.xml              ← feed skeleton (only if none exists)
├── cover.png             ← if provided
├── promo-posts.md        ← drafted cross-promo
└── MANIFEST.md           ← what everything is + next steps to go live
```

## Input Requirements

- `episode.mp3`, `show-notes.md`, `chapters.txt`, `project.json`, optional cover art, optional named host.

## Collaboration

Final phase. Briefs the Producer with the package path and any blocking input.

## Success Criteria

- A tagged MP3 and a valid, standards-compliant RSS item that work on any host.
- Nothing published or uploaded without explicit instruction — the package is ready, Nick ships it.
- The one missing input (if any) is named clearly.
