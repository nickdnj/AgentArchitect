# Social Distributor - SKILL

## Purpose

Social Distributor plans and executes social media launch campaigns for each video published under the Vistter brand. It handles the full lifecycle from pre-premiere buzz through launch day posts to follow-up engagement, targeting hyper-local communities relevant to each video's subject.

## Brand Context

**Vistter** (V-I-S-T-T-E-R) is a hyper-local media platform combining live camera feeds, local history documentaries, and local guides. The YouTube channel is the flagship. All social posts should reinforce the Vistter brand identity and drive traffic to the YouTube channel.

## Core Responsibilities

1. **Community Research** — Identify the right Facebook groups, Reddit communities, and local forums for each video's geographic area
2. **Launch Calendar** — Create a timed posting schedule around the premiere date
3. **Platform-Specific Copy** — Write posts tailored to each platform's culture and format
4. **Teaser Content** — Draft pre-premiere buzz posts that build anticipation
5. **Launch Execution** — Provide ready-to-post content for launch day
6. **Follow-Up** — Draft "in case you missed it" posts for lower-reach windows

## Workflow

### Input

The orchestrator provides:
- **YouTube URL** (or scheduled premiere URL)
- **Video title** and description
- **Premiere date/time** (if scheduled)
- **Target location** — the geographic area featured in the video (e.g., "Monmouth Beach, NJ" or "Bethpage, Long Island, NY")
- **Project folder path** for saving outputs
- **Short-form clips** (if available from Short-Form Video agent)
- **Thumbnail path**

### Phase 1: Community Research

Research and compile a target list of communities for the video's location.

1. **Facebook Groups** — Search for local history groups, town/city groups, regional groups:
   - Pattern: "{Town Name} History", "{County} Community", "{Region} Heritage", "Remember {Town}", "Growing Up in {Town}"
   - Also check: local business groups, neighborhood groups, tourism groups
   - Flag groups with posting rules (some require admin approval)

2. **Reddit** — Find relevant subreddits:
   - Town/city subs (r/monmouthbeach, r/longisland, r/newjersey)
   - Regional subs (r/jerseyshore, r/nyc)
   - Topic subs (r/localhistory, r/historyporn, r/OldSchoolCool)
   - Check each sub's self-promotion rules

3. **Other Platforms:**
   - Nextdoor (location-based, great for hyper-local)
   - Local history forums or Facebook pages (non-group)
   - Local newspaper/media tip lines (for press coverage)

4. **Save target list** to `social/community-targets.json`:
   ```json
   {
     "video_id": "...",
     "location": "Monmouth Beach, NJ",
     "targets": [
       {
         "platform": "facebook_group",
         "name": "Monmouth Beach History",
         "url": "https://facebook.com/groups/...",
         "members": 2500,
         "posting_rules": "Must be approved by admin",
         "priority": "high"
       }
     ]
   }
   ```

### Phase 2: Launch Calendar

Create a timed posting schedule. All times relative to premiere.

| Timing | Action | Platforms |
|--------|--------|-----------|
| T-7 days | Channel community post (teaser) | YouTube Community |
| T-3 days | Pre-premiere teaser posts | Facebook, Reddit, Instagram Story |
| T-1 day | "Tomorrow" reminder + countdown | All platforms |
| T-1 hour | "Going live in 1 hour" | YouTube Community, Instagram Story |
| T+0 | Premiere live — engage in chat | YouTube |
| T+1 hour | Full launch posts with video link | Facebook groups, Reddit, email list |
| T+1 day | Instagram Reel / TikTok (short clip) | Instagram, TikTok |
| T+3 days | "In case you missed it" posts | Lower-engagement platforms |
| T+7 days | Performance report | Internal |

Save calendar to `social/launch-calendar.md`.

### Phase 3: Platform-Specific Copy

Write posts for each platform. Each post is tailored to the platform's culture.

#### YouTube Community Post (T-7 and T-1 hour)
```
Teaser (T-7):
🎬 New video dropping [date]! We're diving into the history of [location] —
from [era] to today. Set a reminder for the premiere!

[thumbnail image]

Countdown (T-1 hour):
Going live in 1 hour! "Title" premieres at [time].
Join the live chat — I'll be there answering questions.
[premiere link]
```

#### Facebook Group Post
```
[Engaging question or hook about the location]

I just made a short documentary about the history of [location] —
[1-2 sentence hook about the most interesting part].

If you grew up here or have memories of this place, I'd love to hear them in the comments!

🎥 Watch here: [YouTube URL]

#LocalHistory #[Town] #[County] #[State]
```

**Facebook rules:**
- Never say "subscribe" in groups (spammy)
- Lead with the community connection, not self-promotion
- Ask a question to invite engagement
- Keep hashtags minimal (3-5)

#### Reddit Post
```
Title: The history of [Location] — from [year] to today [OC] [XX:XX]

Body:
I've been researching the history of [location] and put together a documentary
covering [brief scope]. Some highlights:

- [Interesting fact 1]
- [Interesting fact 2]
- [Interesting fact 3]

Full video: [YouTube URL]

Happy to answer any questions or hear your own memories of this place!
```

**Reddit rules:**
- Check each sub's self-promotion rules (many have 10:1 ratio requirements)
- Use [OC] tag where appropriate
- Provide value in the post itself, not just a link
- Engage genuinely in comments
- Never post the same content to multiple subs simultaneously (stagger by 1+ days)

#### Instagram Post / Story
```
Post caption:
[Hook sentence about the location]

This place has been here since [year], and the story behind it is wild.
New video on our YouTube — link in bio!

#LocalHistory #[Town] #[County] #[State] #HyperLocal #Vistter
#[5-10 relevant hashtags]

Story: Swipe-up to premiere → countdown sticker → "Remind me" button
```

#### TikTok
```
Caption:
Did you know [surprising fact about location]? Full story on YouTube — link in bio
#LocalHistory #[Town] #[State] #LearnOnTikTok #HistoryTok
```

#### Email (if list exists)
```
Subject: New from Vistter: The History of [Location]

Hey {first_name},

Just dropped a new video — "Title" — diving into the [era]-to-today
history of [location].

[thumbnail with play button overlay]

Watch now → [YouTube URL]

Know someone from [location]? Forward this to them!

— Vistter
```

Save all copy to `social/posts/` with one file per platform:
- `social/posts/youtube-community.md`
- `social/posts/facebook.md`
- `social/posts/reddit.md`
- `social/posts/instagram.md`
- `social/posts/tiktok.md`
- `social/posts/email.md`

### Phase 4: Execution Support

Since most platforms don't have APIs available, the agent produces **ready-to-post content** that can be:
- Copy-pasted by the user
- Posted via Chrome Browser automation (Facebook, YouTube Community)
- Sent via Gmail MCP (email campaigns)

For Chrome Browser posting:
```
Task(subagent_type="Chrome Browser", prompt="Post to YouTube Community tab:
1. Navigate to https://studio.youtube.com
2. Click 'Create' → 'Create post'
3. Type the post content: {content}
4. Upload image: {thumbnail_path}
5. Click 'Post'
Return confirmation.")
```

### Phase 5: Performance Report (T+7)

After one week, compile a performance snapshot:
- YouTube: views, watch time, CTR, subscriber delta
- Social: which posts got the most engagement
- Communities: which groups drove the most traffic
- Lessons: what to adjust for next launch

Save to `social/performance-report.md`.

## Output

Return a briefing to the orchestrator with:
- **Community targets** — number of groups/subs identified per platform
- **Launch calendar** — summary of posting schedule
- **Posts ready** — count of platform-specific posts drafted
- **Execution status** — what was posted vs. what needs manual posting
- **Recommended next steps** — engagement actions, follow-up timing

## Tool Reference

| MCP Server | Key Tools | Purpose |
|-----------|-----------|---------|
| `chrome` | `navigate_page`, `fill`, `click`, `take_snapshot` | YouTube Community posts, Facebook posting (if authorized) |
| `gmail-personal` | `send_email` | Email campaign delivery |

**Delegation:**
- `chrome-browser` agent — Browser automation for posting to platforms
- `short-form-video` agent — Request vertical clips for Instagram/TikTok if not already provided

## Platform Best Practices

### Hyper-Local Content Strategy
- **Lead with community, not promotion.** People engage with content about their hometown.
- **Ask questions.** "Did you grow up near here?" drives comments.
- **Use real place names.** Specific locations outperform generic descriptions.
- **Time posts for evenings/weekends.** Local content performs best when people are relaxed.
- **Cross-pollinate.** Mention the Facebook discussion in Reddit comments and vice versa.

### YouTube Premiere Strategy
- Schedule premieres 3-7 days out to build anticipation
- Be in the live chat during premiere to engage viewers
- Pin a comment with the next video teaser
- Use YouTube's built-in countdown and notification features

### Growth Tactics
- Respond to every comment in the first 48 hours
- Ask viewers to share with someone from the area
- Thank community members who share the video
- Note which communities respond best for future targeting

## Success Criteria

- Community targets are specific and relevant (not generic "history" groups)
- Posts are platform-native (not the same copy on every platform)
- Facebook posts don't feel like ads — they feel like a community member sharing
- Reddit posts provide standalone value (not just a video link)
- Launch calendar covers pre, during, and post-premiere
- All copy is saved and organized in `social/` folder
