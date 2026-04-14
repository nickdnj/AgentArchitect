# S2-3: Full-Blown Cold

## Series: Sick Day Math
## Format: 9:16 vertical (1080x1920), ~30-35 seconds

---

## Narration Script (ElevenLabs Josh voice)

**Scene 1 — HOOK (0-3s):**
"Everything hurts. Head. Throat. Chest. You're a mess."

**Scene 2 — THE FIX (4-18s):**
"Four pills. The nuclear option. Tylenol for pain and fever. Robitussin for the cough. Mucinex to break up the chest congestion. And Sudafed to unclog your head. That's the full arsenal."

**Scene 3 — THE COST (19-25s):**
"A box of NyQuil Severe runs eighteen bucks. The same four generics? Fifty cents."

**Scene 4 — CTA (26-35s):**
"Cold Plan breaks down every brand-name cold medicine into its generic recipe. Link in bio."

---

## Image Prompts (gpt-image-1, Falore style, 1024x1536, NO TEXT IN IMAGES)

**01-hook.png:**
Warm editorial illustration in Falore style — hand-drawn sketch with visible brush textures, warm amber and cream palette. Person slumped on a couch wrapped in a blanket, surrounded by tissues, a mug of tea, and a thermometer. They look completely miserable — red nose, heavy eyes, the whole picture of a full-blown cold. Warm but sympathetic mood. No text anywhere in the image.

**02-pills-fix.png:**
Warm editorial illustration in Falore style. Close-up overhead view of an open palm holding exactly 4 generic pills — one round white tablet (acetaminophen/Tylenol), one red gel cap (dextromethorphan/Robitussin), one large white oblong tablet (guaifenesin/Mucinex), and one oblong red pill (pseudoephedrine/Sudafed). Warm amber background. Four bottles (Tylenol, Robitussin, Mucinex, Sudafed) softly blurred in background. No text anywhere in the image.

**03-price-compare.png:**
Warm editorial illustration in Falore style. Split composition: left side shows a large box of NyQuil Severe with a red price tag showing $18, right side shows 4 small generic pills with a green price tag showing 50 cents. The contrast is dramatic — huge branded box vs four tiny pills. Warm amber and cream palette. No text anywhere in the image.

**04-cta-phone.png:**
Warm editorial illustration in Falore style. A hand holding a smartphone displaying the Cold Plan app interface — showing a symptom planner with multiple symptoms checked (headache, sore throat, cough, congestion) and 4 matched drug recommendations below. Warm amber background. The phone screen should look like a real app with clean UI. No text anywhere in the image.

---

## Text Overlay Specs

### Layer 1 — Info Labels (Futura Bold, top of screen)

Scene 2 pill labels (staggered reveal, 4 pills = tighter spacing):
- "Tylenol" (fontsize 60, white, borderw 3) at y=h*0.08, appears at scene2_start+0.3s
- "pain & fever" (fontsize 38, gold #FFD700, borderw 3) at y=h*0.08+65
- "Robitussin" (fontsize 60, white, borderw 3) at y=h*0.08+120, appears at scene2_start+2.5s
- "cough" (fontsize 38, gold #FFD700, borderw 3) at y=h*0.08+185
- "Mucinex" (fontsize 60, white, borderw 3) at y=h*0.08+240, appears at scene2_start+5.0s
- "chest congestion" (fontsize 38, gold #FFD700, borderw 3) at y=h*0.08+305
- "Sudafed" (fontsize 60, white, borderw 3) at y=h*0.08+360, appears at scene2_start+7.5s
- "head congestion" (fontsize 38, gold #FFD700, borderw 3) at y=h*0.08+425

Scene 3 price labels:
- "$18" (fontsize 80, red #FF4444, borderw 4) at x=w*0.10, y=h*0.08, appears at scene3_start
- "50 cents" (fontsize 80, green #44FF44, borderw 4) at x=w*0.58, y=h*0.08, appears at scene3_start+1.5s

Scene 4 CTA block:
- "cold-plan-app.web.app" (fontsize 56, white, borderw 4) at y=h*0.78, appears at scene4_start
- "Every recipe. Every price." (fontsize 44, light blue #AADDFF, borderw 3) at y=h*0.78+66, +1s
- "Free. No login. No ads. No data collected." (fontsize 34, light gray #CCCCCC, borderw 3) at y=h*0.78+126, +2s

### Layer 2 — TikTok Narration Captions (Impact, center screen)

Scene 1 (y=h*0.46):
- "Everything hurts." | "Head. Throat." | "Chest." | "You're a mess."

Scene 2 (y=h*0.46):
- "Four pills." | "The nuclear option." | "Tylenol" | "for pain and fever." | "Robitussin" | "for the cough." | "Mucinex to break up" | "the chest congestion." | "And Sudafed" | "to unclog your head." | "That's the full arsenal."

Scene 3 (y=h*0.46):
- "A box of" | "NyQuil Severe" | "runs eighteen bucks." | "The same four" | "generics?" | "Fifty cents."

Scene 4 (y=h*0.30 — MOVED UP to avoid CTA overlap):
- "Cold Plan breaks down" | "every brand-name" | "cold medicine" | "into its generic recipe." | "Link in bio."

---

## Audio Files to Generate
- audio/01-hook.mp3
- audio/02-fix.mp3
- audio/03-cost.mp3
- audio/04-cta.mp3
