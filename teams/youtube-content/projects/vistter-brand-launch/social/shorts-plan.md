# Shorts Plan: Monmouth Beach — Sand, Scandal, and the Shore

**Source video:** `teams/youtube-content/projects/monmouth-beach-history/monmouth-beach-v11.mp4`
**Video specs:** 1920x1080, H.264, 30fps, 523s total
**Target output:** `teams/youtube-content/projects/monmouth-beach-history/social/`
**Format:** 1080x1920 vertical (9:16), <60 seconds, H.264/AAC

---

## Moment Selection Rationale

The script was analyzed for the four criteria that stop scrolls: (1) a hook that lands in 3 seconds, (2) a self-contained narrative arc, (3) a curiosity gap that drives to the full video, and (4) emotional charge — outrage, surprise, or awe. Three segments scored highest:

1. **Land Pirates (Seg 3, 1:00–1:50)** — Classic misinformation reversal. The hook "they were branded land pirates" sets up the punchline "there is no evidence — none." Moral outrage + surprise. Universally relatable injustice angle.
2. **The Scandal (Seg 6, 3:40–4:20)** — $15 million vanished, impeachment blocked by the President, and the briber was the sitting Senator who had voted to impeach a different president. Jaw-drop storytelling with a political resonance that feels modern.
3. **Rum Runners (Seg 9, 5:25–6:05)** — Cinematic setup. "The same skills that made them legendary fishermen made them exceptional criminals." Fast boats, dark water, cops in pursuit. High action, strong visual imagery, broad audience appeal.

Segments 1 (Hook), 10 (Sandy), and 11 (Endurance) were considered but deprioritized: Segment 1 is only 20 seconds and works better as a teaser than a standalone; Sandy and Endurance are strong emotionally but don't have the standalone story arc of the three selected.

---

## Clip 1 — "They Were Called Land Pirates"

**Source segment:** Segment 3 — Land Pirates & Wreckers
**Source timestamps:** 1:00 — 1:50 (50 seconds)
**Target duration:** ~45 seconds (trim first 5s of segment for tighter hook entry)

**Why it works:**
The reversal structure is perfect for short-form: accusation → buildup → reveal. The hook lands in 2 seconds ("They were branded land pirates"). The payoff ("there is no evidence — none") provides a satisfying micro-resolution while the viewer is left wanting to know the full context — ideal for driving to the full video.

**Hook line (first 3 seconds):**
"They were branded LAND PIRATES."

**Narration arc:**
> "They were branded bandits and land pirates. Newspapers accused them of hanging false lights to confuse ships' captains... [buildup] ...In 1799, New Jersey made it a crime. But here's the part history forgets... [pause] ...There is no evidence — none — that anyone in Monmouth County ever lured a ship to its destruction."

### Production Specs

| Field | Value |
|-------|-------|
| Extract start | `00:01:05` |
| Extract end | `00:01:50` |
| Duration | 45s |
| Crop | Center crop: `crop=1080:1920:(iw-1080)/2:0` |
| Hook overlay | "They were called LAND PIRATES." — top, y=220, white/black border, show 0–4s |
| CTA overlay | "Full story on my channel" — bottom, y=h-280, show last 4s |
| Output file | `short-01-land-pirates.mp4` |

### FFmpeg Commands

```bash
# Step 1: Extract and crop to vertical
ffmpeg -ss 00:01:05 -i monmouth-beach-v11.mp4 -t 45 \
  -vf "scale=-1:1920,crop=1080:1920:(iw-1080)/2:0" \
  -c:v libx264 -b:v 8M -c:a aac -b:a 192k \
  social/short-01-land-pirates-vertical.mp4

# Step 2: Add text overlays (hook + CTA)
ffmpeg -i social/short-01-land-pirates-vertical.mp4 \
  -vf "drawtext=text='They were called':fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:fontsize=72:fontcolor=white:borderw=5:bordercolor=black:x=(w-text_w)/2:y=200:enable='lte(t,4)',\
drawtext=text='LAND PIRATES':fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:fontsize=96:fontcolor=yellow:borderw=5:bordercolor=black:x=(w-text_w)/2:y=290:enable='lte(t,4)',\
drawtext=text='Full story on my channel':fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:fontsize=56:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-280:enable='gte(t,41)'" \
  -c:a copy social/short-01-land-pirates-final.mp4
```

### Platform Metadata

**YouTube Shorts**
- Title: `New Jersey's "Land Pirates" — The Truth Is Darker #Shorts`
- Description:
  ```
  They were accused of luring ships onto rocks and plundering the wreckage.
  But the real story is even more interesting.

  Watch the full documentary: [LINK]

  #Shorts #NewJersey #History #TrueHistory #JerseyShore #LandPirates
  ```
- Tags: `NewJersey, History, Shorts, JerseyShore, TrueHistory, Maritime, LandPirates`

**Instagram Reels**
- Caption:
  ```
  "Land pirates." That's what newspapers called the people of Monmouth County, NJ
  — accused of hanging false lights to lure ships onto rocks and strip them clean.

  The truth? There's no evidence it ever happened. They were the ones saving lives.

  Full documentary on my YouTube channel — link in bio.

  #History #NewJersey #JerseyShore #TrueHistory #Maritime #LandPirates #Reels #NJHistory
  ```

**TikTok**
- Caption:
  ```
  NJ's "land pirates" were actually the heroes #NewJersey #History #TrueHistory #JerseyShore #Maritime #LandPirates
  ```

---

## Clip 2 — "The Navy Secretary Who Stole $15 Million"

**Source segment:** Segment 6 — The Scandal
**Source timestamps:** 3:40 — 4:20 (40 seconds)
**Target duration:** 40 seconds (use full segment)

**Why it works:**
Political corruption, a jaw-dropping dollar figure ($15M in 1876 money), a president who refused to act, and a twist ending — the briber had voted to impeach a different president 8 years earlier. Every sentence escalates the outrage. This is built for shares.

**Hook line (first 3 seconds):**
"$15 MILLION just... vanished."

**Narration arc:**
> "George Robeson controlled $56 million in Navy construction funds. In 1876, Congress discovered $15 million of it had simply vanished. A contractor gave him horses, real estate, and a $320,000 vacation cottage on the Jersey Shore. The committee recommended impeachment. President Grant refused to act. And the man behind the bribes? A sitting U.S. Senator — who had voted to impeach President Johnson just 8 years earlier."

### Production Specs

| Field | Value |
|-------|-------|
| Extract start | `00:03:40` |
| Extract end | `00:04:20` |
| Duration | 40s |
| Crop | Center crop: `crop=1080:1920:(iw-1080)/2:0` |
| Hook overlay | "$15 MILLION vanished." — top, y=220, yellow/black border, show 0–3.5s |
| CTA overlay | "Full scandal on my channel" — bottom, y=h-280, show last 4s |
| Output file | `short-02-scandal.mp4` |

### FFmpeg Commands

```bash
# Step 1: Extract and crop to vertical
ffmpeg -ss 00:03:40 -i monmouth-beach-v11.mp4 -t 40 \
  -vf "scale=-1:1920,crop=1080:1920:(iw-1080)/2:0" \
  -c:v libx264 -b:v 8M -c:a aac -b:a 192k \
  social/short-02-scandal-vertical.mp4

# Step 2: Add text overlays (hook + CTA)
ffmpeg -i social/short-02-scandal-vertical.mp4 \
  -vf "drawtext=text='The Navy Secretary who stole':fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:fontsize=64:fontcolor=white:borderw=5:bordercolor=black:x=(w-text_w)/2:y=200:enable='lte(t,3.5)',\
drawtext=text='\$15 MILLION':fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:fontsize=108:fontcolor=yellow:borderw=5:bordercolor=black:x=(w-text_w)/2:y=290:enable='lte(t,3.5)',\
drawtext=text='Full scandal on my channel':fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:fontsize=56:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-280:enable='gte(t,36)'" \
  -c:a copy social/short-02-scandal-final.mp4
```

### Platform Metadata

**YouTube Shorts**
- Title: `The Navy Secretary Who Stole $15 Million — Then Got Away With It #Shorts`
- Description:
  ```
  The Secretary of the Navy controlled $56 million in federal funds.
  Congress found $15 million missing. The President refused to act.
  And the briber? A sitting U.S. Senator.

  Full documentary: [LINK]

  #Shorts #History #Corruption #NewJersey #USHistory #PoliticalScandal
  ```
- Tags: `History, Shorts, Corruption, NewJersey, USHistory, PoliticalScandal, Robeson`

**Instagram Reels**
- Caption:
  ```
  In 1876, Congress discovered the U.S. Secretary of the Navy had "lost" $15 million in federal
  construction funds. A contractor gave him horses, real estate, and a $320,000 vacation house
  on the Jersey Shore as bribes.

  Congress recommended impeachment. President Grant said no.

  The briber? A sitting Senator — who had voted to impeach a DIFFERENT president just 8 years earlier.

  Full documentary on YouTube — link in bio.

  #History #Corruption #NewJersey #PoliticalScandal #JerseyShore #USHistory #NJHistory #Reels
  ```

**TikTok**
- Caption:
  ```
  He "lost" $15M of Navy funds and the President covered for him #History #Corruption #USHistory #NewJersey #PoliticalScandal
  ```

---

## Clip 3 — "The Fishermen Who Became Bootleggers"

**Source segment:** Segment 9 — Rum Runners
**Source timestamps:** 5:25 — 6:05 (40 seconds)
**Target duration:** 40 seconds (use full segment)

**Why it works:**
Opens with one of the best lines in the script — a direct pivot that reframes the entire fishing village into an outlaw story. Strong cinematic imagery (fast boats, dark water, no lights, Coast Guard pursuit). The phrase "exceptional criminals" is instantly quotable and shareable. Ends with a clean resolution (the golden age ends), making it a complete story.

**Hook line (first 3 seconds):**
"The same skills that made them great fishermen..."

**Narration arc:**
> "Then came Prohibition. The same skills that made them legendary fishermen made them exceptional criminals. The fishermen's Sea Bright skiff was modified into souped-up speedboats that could outrun Coast Guard cutters. On the darkest nights, rum-runners raced into Raritan Bay, beached their skiffs, handed off crates of whiskey to waiting trucks — and vanished."

### Production Specs

| Field | Value |
|-------|-------|
| Extract start | `00:05:25` |
| Extract end | `00:06:05` |
| Duration | 40s |
| Crop | Center crop: `crop=1080:1920:(iw-1080)/2:0` |
| Hook overlay | "Then came PROHIBITION." — top, y=220, white/black border, show 0–3.5s |
| CTA overlay | "Full story on my channel" — bottom, y=h-280, show last 4s |
| Output file | `short-03-rum-runners.mp4` |

### FFmpeg Commands

```bash
# Step 1: Extract and crop to vertical
ffmpeg -ss 00:05:25 -i monmouth-beach-v11.mp4 -t 40 \
  -vf "scale=-1:1920,crop=1080:1920:(iw-1080)/2:0" \
  -c:v libx264 -b:v 8M -c:a aac -b:a 192k \
  social/short-03-rum-runners-vertical.mp4

# Step 2: Add text overlays (hook + CTA)
ffmpeg -i social/short-03-rum-runners-vertical.mp4 \
  -vf "drawtext=text='Then came':fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:fontsize=80:fontcolor=white:borderw=5:bordercolor=black:x=(w-text_w)/2:y=200:enable='lte(t,3.5)',\
drawtext=text='PROHIBITION':fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:fontsize=96:fontcolor=yellow:borderw=5:bordercolor=black:x=(w-text_w)/2:y=295:enable='lte(t,3.5)',\
drawtext=text='Full story on my channel':fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:fontsize=56:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-280:enable='gte(t,36)'" \
  -c:a copy social/short-03-rum-runners-final.mp4
```

### Platform Metadata

**YouTube Shorts**
- Title: `NJ Fishermen Became Prohibition Bootleggers — On the Same Boats #Shorts`
- Description:
  ```
  "The same skills that made them legendary fishermen made them exceptional criminals."

  Monmouth County's Sea Bright fishermen souped up their flat-bottomed skiffs and
  started outrunning Coast Guard cutters in the dark.

  Full documentary: [LINK]

  #Shorts #History #Prohibition #NewJersey #Bootleggers #RumRunners #JerseyShore
  ```
- Tags: `History, Shorts, Prohibition, NewJersey, Bootleggers, RumRunners, JerseyShore`

**Instagram Reels**
- Caption:
  ```
  "The same skills that made them legendary fishermen made them exceptional criminals."

  When Prohibition hit Monmouth County, NJ, the fishermen of Galilee already had everything
  they needed: knowledge of every inlet, flat-bottomed skiffs, and zero fear of dark water.

  They modified their boats into speedboats that could outrun Coast Guard cutters.
  On the darkest nights, they ran whiskey onto the beach and vanished.

  Full documentary on YouTube — link in bio.

  #History #Prohibition #NewJersey #Bootleggers #RumRunners #JerseyShore #NJHistory #Reels
  ```

**TikTok**
- Caption:
  ```
  NJ fishermen became Prohibition bootleggers using their own fishing boats #History #Prohibition #NewJersey #Bootleggers #RumRunners #JerseyShore
  ```

---

## Posting Schedule

| Day | Platform | Clip |
|-----|----------|------|
| Day 1 (publish day) | YouTube Shorts | Clip 1 — Land Pirates |
| Day 1 | Instagram Reels | Clip 1 — Land Pirates |
| Day 1 | TikTok | Clip 1 — Land Pirates |
| Day 2 | YouTube Shorts | Clip 2 — Scandal |
| Day 2 | Instagram Reels | Clip 2 — Scandal |
| Day 3 | TikTok | Clip 2 — Scandal |
| Day 4 | YouTube Shorts | Clip 3 — Rum Runners |
| Day 5 | Instagram Reels | Clip 3 — Rum Runners |
| Day 6 | TikTok | Clip 3 — Rum Runners |

Strategy notes:
- Post Clip 1 same day as the full video to drive initial traffic.
- Stagger Clips 2 and 3 across the first week to keep feeding algorithm signals.
- Instagram: post at 11am–1pm ET or 7pm–9pm ET for best Reels reach.
- TikTok: slightly more flexible, evenings (6pm–10pm ET) perform well.
- YouTube Shorts: post at any time; the algorithm will distribute over 24–48 hours.

---

## State Tracker

See `shorts-tracker.json` for upload status. Update after each platform upload.

---

## Next Steps

1. Run the FFmpeg commands above for each clip (or use the test clip already produced — see below).
2. Transcribe each clip's audio with Whisper and generate ASS subtitle files in `social/subs/`.
3. Burn subtitles into each final clip.
4. Generate thumbnails: `ffmpeg -i short-0N-slug-final.mp4 -vf "select=eq(n\,30)" -vframes 1 short-0N-thumb.jpg`
5. Upload YouTube Shorts via `scripts/youtube-upload.py`.
6. Delegate Instagram Reels and TikTok uploads to Chrome Browser agent.
7. Update `shorts-tracker.json` with upload URLs and dates.
