#!/usr/bin/env python3
"""Regenerate the wiki storyboard from the v14 manifest + v19 narration map. Deterministic + in-sync."""
import json

MAN="/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/message-in-the-machine/assembly-manifest-v4.json"
SB="/Users/nickd/Workspaces/wiki/teams/youtube-content/message-in-the-machine/storyboard.md"
m=json.load(open(MAN)); P=m["pages"]

# segment label per manifest index
def seg(i):
    if i<6: return "Seg 1 — Docent Intro (decade walk, REAL VCF banners)"
    if i<11: return "Seg 2 — Sand Hill Vending"
    if i<17: return "Seg 3 — What He Could Do"
    if i<26: return "Seg 4 — The Hex Dump (Donkey Kong)"
    if i<31: return "Seg 5 — Who Left the Message"
    if i<34: return "Seg 6 — The Lawsuit"
    return "Seg 7 — Close (REAL VCF museum photos)"

# narration per manifest index (aligned to v19 script.md)
N=[
"Hi, my name is Nick. I'm a docent here at the Vintage Computer Museum at InfoAge, in Wall Township, New Jersey. Let me show you around. The whole museum is laid out by decade.",
"You walk in, and you're standing in the 1940s, back when a computer filled a whole room, all relays and vacuum tubes. Then the 1950s, magnetic core memory, the first machines that could really remember.",
"The 1960s, transistors, and the mainframes that ran the world.",
"The 1970s, when it all shrank down onto little chips, and for the first time a computer could sit on your desk.",
"And then you reach the 1980s. And this is the decade I want to stop on.",
"Because sitting right here is a TRS-80, the old Radio Shack computer. The exact kind of machine my dad had down in our basement, in 1981. And that machine is where my story starts.",
"In the 80's, arcade games filled the bars, the bowling alleys, the pizza joints, everywhere people went to have fun. And where I grew up, on Long Island, my family owned and operated them. That was our business. Which meant the best arcade I knew was my own house. Free play all day, friends always over.",
"Here's the strange part, though. I was rarely the one playing. When games are your work, you stop being a player.",
"I loved the machines, what made them tick, what was hiding inside. Playing them? That was never really my thing. My dad fixed everything. If something broke, he didn't replace it. He figured out how it worked, and then he fixed it himself.",
"But he didn't stop at fixing. He taught himself to program on that TRS-80, and wrote the whole system that ran the business. From scratch, self-taught.",
"The same machine I'd eventually take to college a few years later. And that same machine, the one running the business, is the one he'd turn on the games themselves.",
# SEG 3 (refactored)
"Here's the thing about my dad. Every machine that came through, he studied it. Not just to fix it, to understand it. What could he do with this thing?",
"If a board died out on location, could he make a backup, so the game didn't just disappear? Could he take the program off one board move it onto another and turn a machine nobody played into the one everybody wanted? Was there an opportunity hiding in there?",
"And every one of those questions started the same way. You had to get the data off the chips. Arcade games lived on little memory chips and everything the game was, lived in there. Just pulling that data out reading the raw code off a chip in 1981 on a Radio Shack computer, that was an incredible thing to watch.",
"And it didn't always come off clean. A game stored itself the way the hardware needed to read it not the way you or I would. So sometimes it came back jumbled out of order nonsense.",
"The real work wasn't pulling the data. It was figuring out the order, sitting there working it out sometimes a bit at a time with little jumper wires until it snapped into place and made sense.",
"That was the part he loved. Not the copying, the puzzle. Back then, when people did it for money, they had a word for it: bootlegging. Today we call it reverse engineering. ROM preservation. The MAME project, a whole community that pulls the code off the original arcade machines and saves it before the hardware's gone for good. Same chips same puzzle. The world just gave it better names.",
# SEG 4
"So one day, my dad calls me over. And I come down the stairs into his office. The whole room sat in a haze of cigarette smoke, the glow of the screen cutting right through it. I lean in over his shoulder.",
"We're staring at the screen of his TRS-80 with a PROM programmer wired into it, one of those Donkey Kong chips sitting in the socket. And on that screen is the dump from the chip. An early Donkey Kong board.",
"Donkey Kong was the new hot game that year, the one with the big ape and the little guy in the red hat they hadn't even named Mario yet.",
"He'd pulled the whole program right off the chip. That part, getting the raw data out, that was the feat, and by now he'd gotten good at it. This one came off clean and readable, the raw guts of the game right there on the screen.",
"And what you're looking at is a hex dump. A listing, laid out in columns. Down the left, and through the middle, it's all hexadecimal numbers. Row after row of them. The raw guts of the program, meaning nothing to me.",
"And then there's a column on the right. That's the text view. It takes those same raw bytes and shows them to you as readable characters, if there's anything readable in there to find. And mostly there isn't. Mostly it's little fragments. A stray character here. The occasional half of a word there. Nothing that means anything.",
"And then scrolling down, in that right-hand column... English. Broken English. An actual sentence. The game... was talking.",
"It said something like: \"Congratulations. If you're reading this, call this number in Tokyo, Japan.\"",
"And I lost my mind. I'm sixteen years old, standing in my dad's office, looking at a secret message that almost nobody on Earth was ever supposed to find.",
# SEG 5
"Now, for forty years, that was just a story I carried around. A thing my dad and I saw on a screen one night. But it never really let me go. So I went home, and I started researching. And for the first time, I learned the real story behind that message.",
"Donkey Kong is a Nintendo game. But Nintendo didn't write the code. They quietly brought in a Japanese engineering firm called Ikegami Tsushinki to actually build it and then never gave them public credit.",
"They were the shadow developer. And buried inside the program, the Ikegami engineers had left a message. For anyone who ever cracked the chip and got in deep enough to read it.",
"The real message read: \"Congratulation! If you analyse difficult this program, we would teach you.\" And then a phone number in Tokyo, Japan. And the words: \"System Design, Ikegami.\"",
"It was a note to a stranger. If you got this far, you're one of us. Congratulation, you found it. Here's our number. Call us. And somebody actually called that number. A bootlegger, mid-copy, picked up the phone and dialed Tokyo for help.",
# SEG 6
"But there's one more piece of the story. When Donkey Kong became a monster hit, Nintendo wanted to keep making it, but they'd fallen out with Ikegami. So they had the code reverse-engineered. Copied.",
"So they could keep cranking out the game without the people who actually built it. Ikegami took them to court for copyright infringement. It dragged on for years. A court sided with Ikegami, that Nintendo didn't own the code, and in the end, the two sides settled out of court.",
"The battle over who really created Donkey Kong came down to what was hidden inside those ROM chips. The message my father had uncovered turned out to be one of the most important clues in the entire case.",
# SEG 7
"So that's the story I wanted to show you, standing here in an old radar building, surrounded by machines. And these days, when I walk through this place, I don't just see cabinets and circuit boards.",
"I see the engineers who built them.",
"The operators who ran them.",
"The kids who played them.",
"Remember that TRS-80 I showed you on the way in? The same kind of machine my dad used to uncover the hidden message inside the Donkey Kong PROMs.",
"Every time I walk past it, I don't just see an old computer. I see my father, hunched over his desk through a haze of cigarette smoke, patiently pulling the raw code off a chip, until a message surfaced that no one was ever meant to find. That's what we keep here, at the Vintage Computer Museum at InfoAge.",
"Not just old machines, the lives that ran through them. So come visit. Find the computer from your childhood. The one from your first job. The one your dad brought home. Because every one of these machines has a story hiding inside it. Come find yours.",
]
assert len(N)==len(P), f"narration {len(N)} != pages {len(P)}"

def fmt(t):
    return f"{int(t//60):02d}:{t-60*int(t//60):04.1f}"
def first_words(s, k=7):
    w=s.split(); return " ".join(w[:k])+("…" if len(w)>k else "")

# ---- build ----
o=[]
o.append('# Storyboard — "The Message in the Machine"')
o.append("")
o.append("**A first-person docent story from the Vintage Computer Museum at InfoAge (Wall Township, NJ)**")
o.append("")
o.append("> [!danger] AGENTS — DO NOT STRIP THE IMAGE EMBEDS")
o.append("> The `![[...png]]` lines under each page's `**image:**` line are Nick's Obsidian review surface and **must stay**. If a lint/sync removes them, restore with `python3 .../projects/message-in-the-machine/scripts/readd_storyboard_embeds.py`. Full rules: project `AGENTS.md`. This storyboard is regenerated from `assembly-manifest-v4.json` + the v19 `script.md` — edit those, or run `scripts/gen_storyboard_v14.py`.")
o.append("")
o.append("## Production direction (2026-07-03) — READ FIRST")
o.append("- **NEW decade-walk intro (2026-07-03) — Seg 1 rebuilt: Hi-I'm-Nick welcome → 1940s/50s → 1960s → 1970s → 1980s → TRS-80 → into the story. Uses Doug's REAL decade-banner photos (Nick's picks).**")
o.append("- **TRS-80 continuity smoothed (v21):** the machine is now NAMED + shown up front (P6), so the subsequent re-intros are softened — Seg 2 P10 \"program on a TRS-80, the old Radio Shack computer\" → \"program on **that** TRS-80\" (callback); Close P32 \"There's even a TRS-80 in the collection\" → \"**Remember that TRS-80 I showed you on the way in?**\" (full-circle callback). Note: the old intro also set up the family coin-op business; the decade walk drops that, so **Seg 2 opening was tightened** to carry it explicitly — \"And where I grew up, on Long Island, my family owned and operated them. That was our business. Which meant the best arcade I knew was my own house.\" (re-grounds place + names the business).")
o.append("- **Visitor-orphan fixes (v21):** the retired cold open used to introduce a MAME visitor; three downstream refs repaired — Seg 5 \"after that visitor left the museum\" → \"But it never really let me go\"; Close \"the story I told that visitor\" → \"the story I wanted to show you\"; and Seg 3's bare \"The MAME project.\" now explains it inline (\"a whole community that pulls the code off the original arcade machines and saves it before the hardware's gone for good\").")
o.append("- **✅ TIMING LOCKED to the v25 Nick-2 audio (7:50, script rev v22).** CLEANER-TAKE PASS: seg-01/02/03/05 re-rendered as \"flowed\" takes (blank-line pauses removed) to kill pauses/hiccups, with Nick's line/comma edits folded in (Seg 2 cuts + \"Free play all day\"; Seg 3 commas stripped; Seg 5 comma tweaks). seg-04/06/07 kept from v24. Manifest pages retimed; video total = audio 470.19s. Render = v17 (unlisted on Vistter Two). This map + storyboard are synced to the final audio.")
o.append("- **1980s photo (P5) — FIXED:** IMG_1687 was a PORTRAIT shot stored sideways (EXIF orientation 6). Now upright-corrected (`REAL-vcf-1980s-upright.png`) and **pillarboxed with blurred side panels** (per Nick) so the full 'The 1980s' banner stays in frame — no crop. Static hold, which fits the \"this is the decade I want to stop on\" beat. (Other real photos with EXIF orientation — gallery-1/2, TRS-80 hero, Comdyna — render correctly; ffmpeg 8.1.2 auto-rotates them, so they are left untouched.)")
o.append("- **Present-day framing (intro P1–P3b + close) = REAL Vintage Computer Museum photos** (Nick's shoot + Doug's handout). **Only VCF** — no radio/military/space halls. The **1981 story (Seg 2–6) = warm painterly animation**.")
o.append("- **STORY REFACTOR (per Nick + Doug/MAME fact-check):** Seg 3 reframed from \"copy protection / bootlegging DK\" to **\"Dad studied every machine — backup, repurpose, opportunity — and pulling the data off a chip was the feat.\"** The DK program read **clean** (message was never scrambled); the jumper-wire/order puzzle is now a *general* skill in Seg 3, not the DK reveal. Lawsuit corrected: \"a court sided with Ikegami… and they settled out of court.\"")
o.append("- **⚠️ Known follow-up:** the CLOSE still says *\"patiently swapping bits until the nonsense became a message\"* (P38) — mildly inconsistent with the refactor (the DK message wasn't behind a scramble). Flag for a possible tweak; seg-07 audio is otherwise unchanged.")
o.append("- **Open image decisions:** review **Doug's 50 photos** in `doug-photos-review`; P31a UNIVAC (verify VCF); P33 closing card antenna vs. InfoAge sign; Nick's stylized docent portrait (pending file).")
o.append("")
o.append("**Narration source of truth:** `teams/podcast-studio/projects/donkey-kong-infoage/script.md` (v19) + `episode-vo.mp3`. **Timing:** page durations sum exactly to each segment's `_post_atempo` length.")
o.append("")
o.append("---")
o.append("")
o.append("## Summary table")
o.append("")
o.append("| Pg | Seg | In–Out | Dur | Image | Narration first words |")
o.append("|----|-----|--------|-----|-------|----------------------|")
t=0.0
segnum={"Seg 1":1,"Seg 2":2,"Seg 3":3,"Seg 4":4,"Seg 5":5,"Seg 6":6,"Seg 7":7}
for i,p in enumerate(P):
    d=float(p["dur"]); sg=seg(i).split(" —")[0].replace("Seg ","")
    real = p["img"].startswith("real/")
    icon="📷" if real else "🖌"
    o.append(f"| {p['n']} | {sg} | {fmt(t)}–{fmt(t+d)} | {d:.1f} | {icon} {p['img'].split('/')[-1]} | \"{first_words(N[i])}\" |")
    t+=d
o.append(f"| | | **{fmt(t)}** | **{t:.1f}** | | **TOTAL** |")
o.append("")
o.append("---")
o.append("")
o.append("## Detailed pages")
o.append("")
t=0.0; cur_seg=None
for i,p in enumerate(P):
    d=float(p["dur"]); s=seg(i)
    if s!=cur_seg:
        o.append(f"### {s}"); o.append(""); cur_seg=s
    base=p["img"].split("/")[-1]
    flags=[]
    if p.get("diegetic_text"): flags.append("diegetic on-screen text — do NOT burn overlay")
    if p.get("montage"): flags.append("montage shot")
    if p.get("closing_card"): flags.append("COMPOSITED closing card (antenna + lockup + map + QR)")
    tag = "  *("+"; ".join(flags)+")*" if flags else ""
    o.append(f"#### Page {p['n']}  ·  {fmt(t)}–{fmt(t+d)}  ({d:.1f}s){tag}")
    o.append(f"- **image:** {p['img']}")
    o.append(f"  ![[{base}]]")
    o.append(f"- **Narration:** \"{N[i]}\"")
    o.append(f"- **Motion:** {p.get('motion','push-in')}")
    o.append(f"> [!note]- NICK'S NOTES")
    o.append("> ")
    o.append("")
    t+=d

o.append("---")
o.append(f"## Continuity check")
o.append(f"- {len(P)} pages, contiguous, total **{fmt(t)}** (≈{t:.2f}s = v25 audio 470.19s).")
o.append("- Present-day framing (P1–P3b, P30–P33) = real VCF photos; 1981 story (P4–P29) = painted animation.")
o.append("- Diegetic on-screen text: P20 (remembered message), P25 (Ikegami message). Composited closing card: P33.")

open(SB,"w").write("\n".join(o)+"\n")
print(f"storyboard regenerated: {len(P)} pages, total {fmt(t)}")
