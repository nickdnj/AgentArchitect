# S2-2: Can't Sleep, Stuffy Nose

## Series: Sick Day Math
## Format: 9:16 vertical (1080x1920), ~30-35 seconds

---

## Narration Script (ElevenLabs Josh voice)

**Scene 1 — HOOK (0-3s):**
"It's 2 AM. You can't breathe. And you've got that big meeting tomorrow."

**Scene 2 — THE FIX (4-15s):**
"Two pills. Benadryl knocks you out. Sudafed PE opens you up. Same combo you'd get in a box of NyQuil, minus the stuff you don't need. You'll be breathing and sleeping in twenty minutes."

**Scene 3 — THE COST (16-22s):**
"A box of NyQuil plus some Sudafed PE? Fifteen bucks. The same two generics? Twenty cents."

**Scene 4 — CTA (23-35s):**
"Cold Plan breaks down every brand-name cold medicine into its generic recipe. Link in bio."

---

## Image Prompts (gpt-image-1, Falore style, 1024x1536, NO TEXT IN IMAGES)

**01-hook.png:**
Warm editorial illustration in Falore style — hand-drawn sketch with visible brush textures, warm amber and cream palette. POV from bed at night: dark bedroom lit by the glow of a phone showing 2:07 AM. Crumpled tissues on the nightstand, a pillow propped up (can't lie flat). Dim moonlight through window. The scene conveys restless, stuffy-nose insomnia. No text anywhere in the image.

**02-pills-fix.png:**
Warm editorial illustration in Falore style. Close-up of an open palm holding exactly 2 generic pills — one small pink capsule (diphenhydramine/Benadryl) and one small red pill (phenylephrine/Sudafed PE). Warm amber background. Bottles of Benadryl and Sudafed PE softly blurred in background. Clean composition, pills are the hero. No text anywhere in the image.

**03-price-compare.png:**
Warm editorial illustration in Falore style. Split composition: left side shows a box of NyQuil alongside a box of Sudafed PE with a red price tag showing $15, right side shows 2 tiny generic pills with a green price tag showing 20 cents. Visual contrast between bulky branded packages and tiny pills. Warm amber and cream palette. No text anywhere in the image.

**04-cta-phone.png:**
Warm editorial illustration in Falore style. A hand holding a smartphone displaying the Cold Plan app interface — showing a symptom planner with "stuffy nose" and "can't sleep" checked, matched drug recommendations below. Warm amber background. The phone screen should look like a real app with clean UI elements. No text anywhere in the image.

---

## Text Overlay Specs

### Layer 1 — Info Labels (Futura Bold, top of screen)

Scene 2 pill labels (staggered reveal):
- "Benadryl" (fontsize 60, white, borderw 3) at y=h*0.10, appears at scene2_start+0.3s
- "sleep" (fontsize 40, gold #FFD700, borderw 3) at y=h*0.10+70
- "Sudafed PE" (fontsize 60, white, borderw 3) at y=h*0.10+145, appears at scene2_start+2.5s
- "congestion" (fontsize 40, gold #FFD700, borderw 3) at y=h*0.10+215

Scene 3 price labels:
- "$15" (fontsize 80, red #FF4444, borderw 4) at x=w*0.10, y=h*0.08, appears at scene3_start
- "20 cents" (fontsize 80, green #44FF44, borderw 4) at x=w*0.58, y=h*0.08, appears at scene3_start+1.5s

Scene 4 CTA block:
- "cold-plan-app.web.app" (fontsize 56, white, borderw 4) at y=h*0.78, appears at scene4_start
- "Every recipe. Every price." (fontsize 44, light blue #AADDFF, borderw 3) at y=h*0.78+66, +1s
- "Free. No login. No ads. No data collected." (fontsize 34, light gray #CCCCCC, borderw 3) at y=h*0.78+126, +2s

### Layer 2 — TikTok Narration Captions (Impact, center screen)

Scene 1 (y=h*0.46):
- "It's 2 AM." | "You can't breathe." | "And you've got" | "that big meeting."

Scene 2 (y=h*0.46):
- "Two pills." | "Benadryl" | "knocks you out." | "Sudafed PE" | "opens you up." | "Same combo" | "you'd get in NyQuil" | "minus the stuff" | "you don't need." | "Breathing and sleeping" | "in twenty minutes."

Scene 3 (y=h*0.46):
- "A box of NyQuil" | "plus Sudafed PE?" | "Fifteen bucks." | "The same two" | "generics?" | "Twenty cents."

Scene 4 (y=h*0.30 — MOVED UP to avoid CTA overlap):
- "Cold Plan breaks down" | "every brand-name" | "cold medicine" | "into its generic recipe." | "Link in bio."

---

## Audio Files to Generate
- audio/01-hook.mp3
- audio/02-fix.mp3
- audio/03-cost.mp3
- audio/04-cta.mp3
