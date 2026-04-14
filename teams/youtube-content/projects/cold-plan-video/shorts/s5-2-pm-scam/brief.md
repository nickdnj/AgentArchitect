# S5-2: The PM Scam

## Series: The Stuff Nobody Tells You
## Format: 9:16 vertical (1080x1920), ~30-35 seconds

---

## Narration Script (ElevenLabs Josh voice)

**Scene 1 — HOOK (0-3s):**
"Every PM medicine is the same scam."

**Scene 2 — THE REVEAL (4-15s):**
"Advil PM is just Advil plus Benadryl. Tylenol PM is just Tylenol plus Benadryl. Aleve PM? Aleve plus Benadryl. The word PM on the box literally means they added one Benadryl. That's it. And they charge you double for it."

**Scene 3 — THE MATH (16-24s):**
"A bottle of Advil PM costs twelve bucks. A bottle of regular Advil plus a bottle of generic Benadryl? Seven bucks total. And you get way more pills."

**Scene 4 — CTA (25-35s):**
"Cold Plan shows you every recipe behind every brand name. Free. Link in bio."

---

## Image Prompts (gpt-image-1, Falore style, 1024x1536, NO TEXT IN IMAGES)

**01-hook.png:**
Warm editorial illustration in Falore style — hand-drawn sketch with visible brush textures, warm amber and cream palette. Three PM medicine boxes (Advil PM, Tylenol PM, Aleve PM) arranged like a police lineup, dramatic spotlight on them. Suspicious, exposé mood. No text anywhere in the image.

**02-reveal.png:**
Warm editorial illustration in Falore style. A visual equation: an Advil PM box splits apart to reveal a regular Advil bottle plus a Benadryl bottle inside. The "adding one pill" concept is clear. Warm amber tones. Clean, diagrammatic composition. No text anywhere in the image.

**03-math.png:**
Warm editorial illustration in Falore style. Split composition: left side shows a single Advil PM bottle, right side shows a bottle of regular Advil PLUS a bottle of generic Benadryl — two bottles but clearly more product. The "more for less" visual. Warm amber palette. No text anywhere in the image.

**04-cta-phone.png:**
Warm editorial illustration in Falore style. A hand holding a smartphone showing the Cold Plan app brand lookup page with PM medicines listed, each showing their simple 2-pill generic recipe. Warm amber background. No text anywhere in the image.

---

## Text Overlay Specs

### Layer 1 — Info Labels (Futura Bold)

Scene 2 PM equation reveals (staggered):
- "Advil PM" (fontsize 60, white, borderw 3) at y=h*0.10, appears at scene2_start+0.3s
- "= Advil + Benadryl" (fontsize 40, gold #FFD700, borderw 3) at y=h*0.10+70
- "Tylenol PM" (fontsize 60, white, borderw 3) at y=h*0.10+145, appears at scene2_start+2.5s
- "= Tylenol + Benadryl" (fontsize 40, gold #FFD700, borderw 3) at y=h*0.10+215
- "Aleve PM" (fontsize 60, white, borderw 3) at y=h*0.10+290, appears at scene2_start+5.0s
- "= Aleve + Benadryl" (fontsize 40, gold #FFD700, borderw 3) at y=h*0.10+360

Scene 3 price comparison:
- "$12" (fontsize 80, red #FF4444, borderw 4) at x=w*0.10, y=h*0.08
- "$7 + more pills" (fontsize 72, green #44FF44, borderw 4) at x=w*0.48, y=h*0.08, +1.5s

Scene 4 CTA block (staggered):
- "cold-plan-app.web.app" (fontsize 56, white, borderw 4) at y=h*0.78
- "Every recipe. Every price." (fontsize 44, light blue #AADDFF, borderw 3) at y=h*0.78+66, +1s
- "Free. No login. No ads. No data collected." (fontsize 34, light gray #CCCCCC, borderw 3) at y=h*0.78+126, +2s

### Layer 2 — TikTok Narration Captions (Impact, center screen)

Scene 1 (y=h*0.46): "Every PM medicine" | "is the same scam."
Scene 2 (y=h*0.46): "Advil PM" | "is just Advil" | "plus Benadryl." | "Tylenol PM" | "is just Tylenol" | "plus Benadryl." | "Aleve PM?" | "Aleve plus Benadryl." | "The word PM" | "literally means" | "they added one Benadryl." | "And they charge you" | "double for it."
Scene 3 (y=h*0.46): "A bottle of Advil PM" | "costs twelve bucks." | "Regular Advil" | "plus generic Benadryl?" | "Seven bucks total." | "And you get" | "way more pills."
Scene 4 (y=h*0.30): "Cold Plan shows you" | "every recipe" | "behind every brand name." | "Free." | "Link in bio."

## Audio Files: audio/01-hook.mp3, audio/02-reveal.mp3, audio/03-math.mp3, audio/04-cta.mp3
