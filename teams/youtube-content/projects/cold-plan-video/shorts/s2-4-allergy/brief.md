# S2-4: Allergy Season Hit Different

## Series: Sick Day Math
## Format: 9:16 vertical (1080x1920), ~30-35 seconds

---

## Narration Script (ElevenLabs Josh voice)

**Scene 1 — HOOK (0-3s):**
"Sneezing. Runny nose. Itchy everything. It's that time of year."

**Scene 2 — THE FIX (4-15s):**
"Two pills. Benadryl stops the allergic reaction. Sudafed dries you out. Same combo in Benadryl-D. They just slapped a D on the box and doubled the price."

**Scene 3 — THE COST (16-22s):**
"A box of Benadryl-D? Twelve dollars. Two generic pills? Twenty cents."

**Scene 4 — CTA (23-35s):**
"Cold Plan breaks down every brand-name cold medicine into its generic recipe. Link in bio."

---

## Image Prompts (gpt-image-1, Falore style, 1024x1536, NO TEXT IN IMAGES)

**01-hook.png:**
Warm editorial illustration in Falore style — hand-drawn sketch with visible brush textures, warm amber and cream palette. Person standing outside on a beautiful spring day — cherry blossoms or flowers blooming — but they're mid-sneeze, eyes watering, holding a tissue. Pollen particles visible in the warm sunlight. The irony of a gorgeous day that makes you miserable. No text anywhere in the image.

**02-pills-fix.png:**
Warm editorial illustration in Falore style. Close-up of an open palm holding exactly 2 generic pills — one small pink capsule (diphenhydramine/Benadryl) and one oblong red pill (pseudoephedrine/Sudafed). Warm amber background with soft pollen particles floating. Bottles of Benadryl and Sudafed softly blurred in background. Clean composition, pills are the hero. No text anywhere in the image.

**03-price-compare.png:**
Warm editorial illustration in Falore style. Split composition: left side shows a box of Benadryl-D Allergy & Sinus with a red price tag showing $12, right side shows 2 small generic pills with a green price tag showing 20 cents. The Benadryl-D box prominently shows the "D" suffix. Warm amber and cream palette. No text anywhere in the image.

**04-cta-phone.png:**
Warm editorial illustration in Falore style. A hand holding a smartphone displaying the Cold Plan app interface — showing the brand medicine lookup page with Benadryl-D selected, showing its generic recipe breakdown. Spring flowers visible in the blurred background. Warm amber tones. No text anywhere in the image.

---

## Text Overlay Specs

### Layer 1 — Info Labels (Futura Bold, top of screen)

Scene 2 pill labels (staggered reveal):
- "Benadryl" (fontsize 60, white, borderw 3) at y=h*0.10, appears at scene2_start+0.3s
- "allergies & sleep" (fontsize 40, gold #FFD700, borderw 3) at y=h*0.10+70
- "Sudafed" (fontsize 60, white, borderw 3) at y=h*0.10+145, appears at scene2_start+3.0s
- "congestion" (fontsize 40, gold #FFD700, borderw 3) at y=h*0.10+215

Scene 3 price labels:
- "$12" (fontsize 80, red #FF4444, borderw 4) at x=w*0.10, y=h*0.08, appears at scene3_start
- "20 cents" (fontsize 80, green #44FF44, borderw 4) at x=w*0.58, y=h*0.08, appears at scene3_start+1.5s

Scene 4 CTA block:
- "cold-plan-app.web.app" (fontsize 56, white, borderw 4) at y=h*0.78, appears at scene4_start
- "Every recipe. Every price." (fontsize 44, light blue #AADDFF, borderw 3) at y=h*0.78+66, +1s
- "Free. No login. No ads. No data collected." (fontsize 34, light gray #CCCCCC, borderw 3) at y=h*0.78+126, +2s

### Layer 2 — TikTok Narration Captions (Impact, center screen)

Scene 1 (y=h*0.46):
- "Sneezing." | "Runny nose." | "Itchy everything." | "It's that time of year."

Scene 2 (y=h*0.46):
- "Two pills." | "Benadryl stops" | "the allergic reaction." | "Sudafed" | "dries you out." | "Same combo" | "in Benadryl-D." | "They just slapped" | "a D on the box" | "and doubled the price."

Scene 3 (y=h*0.46):
- "A box of" | "Benadryl-D?" | "Twelve dollars." | "Two generic pills?" | "Twenty cents."

Scene 4 (y=h*0.30 — MOVED UP to avoid CTA overlap):
- "Cold Plan breaks down" | "every brand-name" | "cold medicine" | "into its generic recipe." | "Link in bio."

---

## Audio Files to Generate
- audio/01-hook.mp3
- audio/02-fix.mp3
- audio/03-cost.mp3
- audio/04-cta.mp3
