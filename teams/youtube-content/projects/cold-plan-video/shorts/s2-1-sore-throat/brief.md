# S2-1: Sore Throat + Congestion

## Series: Sick Day Math
## Format: 9:16 vertical (1080x1920), ~30-35 seconds

---

## Narration Script (ElevenLabs Josh voice)

**Scene 1 — HOOK (0-3s):**
"You woke up and your throat is on fire."

**Scene 2 — THE FIX (4-15s):**
"Two pills. That's it. Advil for the pain. Sudafed to clear the congestion. Same two ingredients in Advil Cold and Sinus. They just charge you twelve bucks for the combo."

**Scene 3 — THE COST (16-22s):**
"A box of Advil Cold and Sinus runs twelve dollars. The same two generic pills? Twenty-five cents."

**Scene 4 — CTA (23-35s):**
"Cold Plan breaks down every brand-name cold medicine into its generic recipe. Link in bio."

---

## Image Prompts (gpt-image-1, Falore style, 1024x1536, NO TEXT IN IMAGES)

**01-hook.png:**
Warm editorial illustration in Falore style — hand-drawn sketch with visible brush textures, warm amber and cream palette. First-person POV from bed: alarm clock showing 6:30 AM on nightstand, crumpled tissues, a glass of water, morning light through curtains. The scene conveys misery — a sore throat morning. Cozy but uncomfortable. No text anywhere in the image.

**02-pills-fix.png:**
Warm editorial illustration in Falore style. Close-up of an open palm holding exactly 2 generic pills — one round white tablet (ibuprofen/Advil) and one oblong red pill (pseudoephedrine/Sudafed). Warm amber background with soft cream highlights. Clean composition, pills are the hero. Bottles of Advil and Sudafed visible but blurred in background. No text anywhere in the image.

**03-price-compare.png:**
Warm editorial illustration in Falore style. Split composition: left side shows a box of Advil Cold & Sinus with a red price tag showing $12, right side shows 2 small generic pills with a green price tag showing 25 cents. Visual contrast between the bulky branded packaging and the tiny generic pills. Warm amber and cream palette. No text anywhere in the image.

**04-cta-phone.png:**
Warm editorial illustration in Falore style. A hand holding a smartphone displaying the Cold Plan app interface — showing a symptom planner with checkboxes for symptoms and matched drug recommendations below. Warm amber background. The phone screen should look like a real app with clean UI elements. No text anywhere in the image.

---

## Text Overlay Specs

### Layer 1 — Info Labels (Futura Bold, top of screen)

Scene 2 pill labels (staggered reveal):
- "Advil" (fontsize 60, white, borderw 3) at y=h*0.10, appears at scene2_start+0.3s
- "pain & inflammation" (fontsize 40, gold #FFD700, borderw 3) at y=h*0.10+70
- "Sudafed" (fontsize 60, white, borderw 3) at y=h*0.10+145, appears at scene2_start+3.0s
- "congestion" (fontsize 40, gold #FFD700, borderw 3) at y=h*0.10+215

Scene 3 price labels:
- "$12" (fontsize 80, red #FF4444, borderw 4) at x=w*0.10, y=h*0.08, appears at scene3_start
- "25 cents" (fontsize 80, green #44FF44, borderw 4) at x=w*0.58, y=h*0.08, appears at scene3_start+1.5s

Scene 4 CTA block:
- "cold-plan-app.web.app" (fontsize 56, white, borderw 4) at y=h*0.78, appears at scene4_start
- "Every recipe. Every price." (fontsize 44, light blue #AADDFF, borderw 3) at y=h*0.78+66, +1s
- "Free. No login. No ads. No data collected." (fontsize 34, light gray #CCCCCC, borderw 3) at y=h*0.78+126, +2s

### Layer 2 — TikTok Narration Captions (Impact, center screen)

Scene 1 (y=h*0.46):
- "You woke up" | "and your throat" | "is on fire."

Scene 2 (y=h*0.46):
- "Two pills." | "That's it." | "Advil for" | "the pain." | "Sudafed to clear" | "the congestion." | "Same two ingredients" | "in Advil Cold" | "and Sinus." | "They just charge you" | "twelve bucks" | "for the combo."

Scene 3 (y=h*0.46):
- "A box of" | "Advil Cold and Sinus" | "runs twelve dollars." | "The same two" | "generic pills?" | "Twenty-five cents."

Scene 4 (y=h*0.30 — MOVED UP to avoid CTA overlap):
- "Cold Plan breaks down" | "every brand-name" | "cold medicine" | "into its generic recipe." | "Link in bio."

---

## Audio Files to Generate
- audio/01-hook.mp3
- audio/02-fix.mp3
- audio/03-cost.mp3
- audio/04-cta.mp3
