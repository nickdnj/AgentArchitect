# Seven Presidents Park: Publish Plan

**Video:** Seven Presidents Park: The Myth and The Shore
**Series:** Seven Presidents (Video 1 of 5)
**Channel:** vistter2
**Draft video:** teams/youtube-content/projects/seven-presidents-park/output/seven-presidents-draft-v5.mp4
**Metadata:** teams/youtube-content/projects/seven-presidents-park/metadata.json

---

## Proposed Schedule

Today is Sunday, March 22, 2026. Following the Monmouth Beach cadence (Sat-Mon shorts rollout, Tuesday 2 PM ET premiere), the proposed schedule is:

| Date | Day | Action |
|------|-----|--------|
| Sat, Mar 28 | Saturday | Short #1 drops (see below) |
| Sun, Mar 29 | Sunday | Short #2 drops |
| Mon, Mar 30 | Monday | Short #3 drops |
| Tue, Apr 1 | Tuesday 2:00 PM ET | Main documentary premieres (public) |

**Note:** One week gap from today gives time to finish the video, create shorts, and set up the premiere. If the video is ready sooner, bump to Sat Mar 28 / Tue Mar 25 or compress to a Sat/Sun/Mon/Tue in a single week.

---

## Shorts Plan (3 clips)

Pull from these high-energy moments in the script:

### Short #1 -- "They Built a Railroad Overnight"
- **Source segment:** Segment 4, Garfield Story
- **Script excerpt:** The overnight railroad-laying scene (September 5, 1881)
- **Hook line:** "Volunteers laid 3,200 feet of track by torchlight to bring a dying president to the sea."
- **Visual:** LOC Frank Leslie's engraving of track-laying + Francklyn Cottage
- **Target length:** 45-55 seconds
- **Drops:** Saturday, March 28

### Short #2 -- "Grant's Crooked Cottage"
- **Source segment:** Segment 3, Grant -- The First Summer White House
- **Script excerpt:** Friends bought the cottage for "Mrs. Grant" to avoid impropriety -- then used it as the Summer White House for 8 years
- **Hook line:** "His friends couldn't buy him a mansion. So they bought it for his wife instead."
- **Visual:** LOC stereograph of Grant on cottage porch
- **Target length:** 45-55 seconds
- **Drops:** Sunday, March 29

### Short #3 -- "He Kept Us Out of War"
- **Source segment:** Segment 6, Wilson, McKinley, and the End of an Era
- **Script excerpt:** Wilson runs 1916 campaign from Shadow Lawn porch, wins by 3,773 votes in California, declares war five months later
- **Hook line:** "'He Kept Us Out of War.' Five months after winning, he asked Congress to declare war on Germany."
- **Visual:** LOC Wilson nomination photo at Shadow Lawn
- **Target length:** 45-55 seconds
- **Drops:** Monday, March 30

---

## Pre-Premiere Checklist

- [ ] Watch draft v5 end-to-end and note any fixes needed
- [ ] Confirm runtime (target: 7:40-8:10)
- [ ] Create thumbnail (see thumbnail brief below)
- [ ] Create 3 shorts from segments above
- [ ] Upload main video as unlisted (for internal review)
- [ ] Schedule premiere for Tuesday, April 1 at 2:00 PM ET
- [ ] Upload shorts (unlisted) and schedule public release dates
- [ ] Post YouTube Community teaser the day before premiere
- [ ] Confirm AI disclosure in description and end card

---

## Thumbnail Brief

**Concept:** Split-frame composition -- left side: a real LOC photo of Long Branch (beach/hotel, circa 1880s), right side: presidential seal or presidential portrait silhouette. Bold serif title text across the bottom or center.

**Text on thumbnail:**
- Line 1: "7 PRESIDENTS"
- Line 2: "1 BEACH"
- Subtitle: "The Myth and The Shore"

**Alternate concept:** Close-up of the Church of the Presidents exterior (Carpenter Gothic) with the park beach blurred behind it. Title text overlaid in gold.

**Format:** 1280x720 JPEG (YouTube standard)
**Save to:** `assets/thumbnails/thumbnail-final.jpg`

---

## YouTube Upload Settings

| Field | Value |
|-------|-------|
| Title | Seven Presidents Park: The Myth and The Shore |
| Category | Education (ID: 27) |
| Language | English |
| Visibility at upload | Unlisted |
| Scheduled public release | Tuesday, April 1, 2026 at 2:00 PM ET |
| Made for kids | No |
| Altered/AI content | Yes -- AI-generated images used for period scenes |
| Tags | See metadata.json (20 tags) |
| Chapters | Yes -- paste from metadata.json chapters field |

---

## Series Context for Description / End Cards

This is Video 1 of 5 in the Seven Presidents series. The series arc:

1. **The Myth and The Shore** (this video) -- overview, all 7 names, the real count
2. **The General's Summer White House** -- Grant deep dive: poker, Ponzi scheme, memoirs
3. **The President Who Died at the Shore** -- Garfield full story: 79 days
4. **Shadow Lawn and the War** -- Wilson: 1916 campaign, the promise broken
5. **When Long Branch Was America's Playground** -- the resort era: hotels, gamblers, fire

End cards should link to the channel subscribe button and tease Video 2 (Grant).

---

## Upload Method

Per project.json: `publish_to_youtube: false`

Upload manually via YouTube Studio or ask the Video Publisher agent to upload when ready:
- Script: `~/Workspaces/AgentArchitect/scripts/youtube-upload.py`
- Requires OAuth token at `~/.config/youtube-upload/token.pickle`
- Pass `--visibility unlisted` at upload time; change to public when premiere is scheduled

---

## Notes

- The Monmouth Beach main documentary (vistter2) dropped Tuesday March 24 at 2 PM ET after a Sat/Sun/Mon shorts rollout -- same cadence proposed here
- Seven Presidents is a more niche topic than Monmouth Beach; SEO tags lean toward presidential history and Gilded Age enthusiasts, not just local NJ audience
- The series angle is a strong hook for the end card -- "5 videos, 7 presidents" gives viewers a reason to subscribe
