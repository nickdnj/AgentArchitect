# Vistter Brand Launch Plan

**Brand:** Vistter (V-I-S-T-T-E-R)
**Domain:** vistter.com (active, Cloudflare — SSL needs fix) | stream.vistter.com (Cloudflare tunnel, active for VistterStream)
**YouTube Account:** vistter2@gmail.com
**GitHub Repos:** nickdnj/vistter (July 2017), nickdnj/VistterStream (Sep 2025), nickdnj/VistterStudio (Sep 2025), nickdnj/VistterBox (Aug 2025)
**Created:** 2026-03-21

---

## Vision

Vistter is a **hyper-local media platform** combining:
- **Live Feeds** — real-time camera streams with local data overlays (tide, weather, events) via VistterStream
- **Local History Docs** — produced YouTube documentaries about specific places, beaches, businesses, neighborhoods
- **Local Guides** — excursion and activity content for specific regions

The brand is the social layer that aggregates all of it: *"Your Local World."*

### Existing Infrastructure
- **VistterStream** — Live camera streaming with weather/tide overlays, YouTube OAuth broadcast. Server: Tailscale 100.108.181.24. Cloudflare tunnel at `stream.vistter.com`. Docker deployment, FastAPI + React. Security hardened (v5). Not yet public.
- **YouTube Content Team** — Automated video pipeline: Script Writer → Asset Generator → Assembler → Publisher → Short-Form. Two review gates (storyboard + audio).
- **First video (Batter Up)** — v9 complete, positive family/friend feedback. Pending photo permissions.
- **Second video (Bahr's Landing)** — Draft v2 complete, needs polish.
- **Origin (July 2017)** — Original `vistter` repo: Wyze camera → FFmpeg → YouTube Live with weather/tide overlay. The DNA of the brand.

---

## Phase 1 — Brand Identity

**Goal:** Establish visual and verbal identity before any public launch.

### Tasks
- [ ] **Tagline** — Options to evaluate:
  - "Your Local World"
  - "See Where You Are"
  - "Hyper-Local. Always On."
  - "The History. The View. The Place."
- [ ] **Logo** — Simple, modern wordmark. "Vistter" with a location pin or camera icon. Clean enough for YouTube channel art, favicon, and watermark on videos.
- [ ] **Color Palette** — Suggest: ocean blue + sandy neutral + white. Evokes coastal/local feel.
- [ ] **Channel Watermark** — Small Vistter logo for bottom-right of all videos.
- [ ] **Video Intro/Outro** — 3-5 second branded bumper for all YouTube content.

---

## Phase 2 — Digital Presence

**Goal:** Get vistter.com and the YouTube channel launch-ready before first video drops.

### 2a. vistter.com Landing Page
- [ ] Fix SSL error on Cloudflare (update origin cert or point to new host)
- [ ] Build a simple pre-launch landing page:
  - Vistter logo + tagline
  - "Coming soon — hyper-local history, live cams, and local guides"
  - Email signup form (Mailchimp, Buttondown, or Beehiiv)
  - Link to YouTube channel
- [ ] Stack options: Cloudflare Pages (free, fast) or a simple static site

### 2b. YouTube Channel Setup
- [ ] Rename/rebrand the channel to "Vistter"
- [ ] Channel art banner (2560x1440) with tagline and vistter.com
- [ ] Channel description: what Vistter is, what to expect, upload cadence
- [ ] Channel sections: Local History | Live Cams | Local Guides
- [ ] Channel trailer: 60-90 second welcome video (can be made with the content team)
- [ ] About/links: vistter.com, Instagram, TikTok

### 2c. Social Accounts
- [ ] Instagram: @vistter — for short clips, behind-the-scenes, local photo content
- [ ] TikTok: @vistter — vertical cuts of history doc moments + live cam highlights
- [ ] Facebook Page: "Vistter" — for sharing in local groups
- [ ] Reddit account (optional): u/vistter — for organic community posts

---

## Phase 3 — Content Pipeline Pre-Load

**Goal:** Queue 3-5 videos before launch so the channel looks active from day one.

### Content Ideas (Existing + Planned)
1. **Monmouth Beach History** — LAUNCH VIDEO. New production — first video released under the Vistter brand. Hyper-local history of Monmouth Beach, NJ.
2. **Bahr's Landing** — draft v2 complete (9m 10s). NEEDS: API narration re-record, better background music, YouTube metadata/upload. Second release.
3. **Batter Up: The Last Piece of Jolly Roger** — v9 complete, unlisted on YouTube ([link](https://www.youtube.com/watch?v=IQA6vicaDmc)). BLOCKED on: family review, photo permissions (Plainedge Library, Brian Quinn, Robert Berkowitz, LICM). Release when permissions clear.
4. **[Next local history video]** — pick from ideas list
5. **Channel Trailer** — 60-90s Vistter intro video (can produce with content team)

### Upload Strategy
- Upload all 3-5 as **unlisted premieres** before launch day
- Set premiere times: one video per day for the first week
- Create playlists: "Local History — Long Island" | "Local History — Jersey Shore" | "Live Cams" (for VistterStream when ready)
- Region: New York/New Jersey metro area initially (Bethpage LI, Highlands NJ, Monmouth County)

---

## Phase 4 — Launch

**Goal:** Hit the ground running on launch day with maximum organic reach.

### Launch Day Sequence
1. Set all videos from unlisted to premiere (scheduled)
2. Post to Facebook groups for each featured location (e.g., "Long Island History", "Jersey Shore", "Monmouth County", local town groups)
3. Post to Reddit: r/longisland, r/jerseycity, r/newjersey, r/localhistory, specific town subs (r/bethpage, r/highlands, etc.)
4. Post teaser clips to Instagram and TikTok
5. Email the signup list (even if small at launch)
6. Pin the first video comment with "Follow for more local history — new video every 3 days"

### Ongoing Cadence
- **1 long-form video every 3 days** (target)
- **1 short-form clip per video** (Reels/Shorts/TikTok)
- **1 live stream per week** (when VistterStream is ready)
- **Monthly local guide** (longer-form destination content)

---

## Phase 5 — Social Launch Agent (Automation)

**Goal:** After each video is published, an AI agent handles all social distribution automatically.

### Trigger
After `video-publisher` completes and YouTube URL is confirmed.

### Agent Actions
1. **Pre-premiere (48h before):**
   - Draft teaser posts for each platform
   - Identify target Facebook groups and Reddit communities based on video location
   - Schedule posts (or queue for human approval)

2. **Pre-premiere (1h before):**
   - "Going live in 1 hour" reminder posts
   - Pin premiere link in channel community post

3. **Post-premiere (same day):**
   - Full promotional posts with video link
   - Post to all identified communities
   - Reply template for first comments

4. **Follow-up (3 days later):**
   - "In case you missed it" post for platforms with lower reach

### Platforms Covered
- YouTube Community tab
- Facebook (local groups — per video)
- Reddit (local/regional subs — per video)
- Instagram (story + reel teaser)
- TikTok (vertical cut)
- Email list (if available)

---

## Agent Additions to YouTube Content Team

### New Agent: `social-distributor`
**Role:** Social media launch campaigns for each published video
**Stage:** 9 (after video-publisher, alongside short-form-video)
**Inputs:** YouTube URL, video title, description, premiere date, target region/location tags
**Outputs:** Social post drafts, posting schedule, community target list

---

## Key Metrics to Track

- YouTube: subscribers, views per video, watch time, CTR
- Social: shares per post, click-through to YouTube
- Email: open rate, link clicks
- Weekly: which communities drove the most traffic

---

## Next Steps (Prioritized)

1. [ ] Pick a tagline
2. [ ] Create logo / brand kit
3. [ ] Fix vistter.com SSL + build landing page
4. [ ] Rebrand YouTube channel
5. [ ] Claim @vistter on Instagram and TikTok
6. [ ] Build `social-distributor` agent
7. [ ] Add agent to youtube-content team.json
8. [ ] Queue 3 videos as premieres for launch week
9. [ ] Launch!
