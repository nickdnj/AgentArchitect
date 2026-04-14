# S4-2: The $0.47 NyQuil Recipe

## Series: Pharmacy Doesn't Want You to Know
## Format: 9:16 vertical (1080x1920), ~30-35 seconds

---

## Narration Script (ElevenLabs Josh voice)

**Scene 1 — HOOK (0-3s):**
"The forty-seven cent NyQuil recipe."

**Scene 2 — THE RECIPE (4-18s):**
"One Tylenol for pain and fever. One Robitussin for the cough. One Benadryl to knock you out. Three pills. That's the entire recipe. Same active ingredients, same doses, same effect. The only difference is the green color and the price tag."

**Scene 3 — THE CONTRAST (19-25s):**
"A ten-pack of NyQuil liquid caps costs twelve bucks. Thirty doses of the same three generics? Under five dollars total."

**Scene 4 — CTA (26-35s):**
"Cold Plan has the recipe for every brand-name cold medicine. Free. No ads. Link in bio."

---

## Image Prompts (gpt-image-1, Falore style, 1024x1536, NO TEXT IN IMAGES)

**01-hook.png:**
Warm editorial illustration in Falore style — hand-drawn sketch with visible brush textures, warm amber and cream palette. A dramatic close-up of a NyQuil box being X-rayed or seen through, revealing three simple generic pills floating inside where the liquid caps would normally be. Like a blueprint or cross-section view. Mysterious, revelatory mood. No text anywhere in the image.

**02-recipe.png:**
Warm editorial illustration in Falore style. Recipe card composition: three pills laid out neatly in a row on a warm wooden surface, like ingredients in a cooking show. Each pill is distinct — a round white Tylenol tablet, a red Robitussin gel cap, and a pink Benadryl capsule. Clean, simple, almost elegant. The visual says "this is all it takes." No text anywhere in the image.

**03-contrast.png:**
Warm editorial illustration in Falore style. Two shopping bags side by side: left bag has a single NyQuil box poking out the top, right bag overflows with bottles of generic Tylenol, Robitussin, and Benadryl — way more product for less money. Visual abundance contrast. Warm amber tones. No text anywhere in the image.

**04-cta-phone.png:**
Warm editorial illustration in Falore style. A hand holding a smartphone showing the Cold Plan app brand medicine page with NyQuil selected, displaying its 3-pill generic recipe. Warm amber background, inviting. No text anywhere in the image.

---

## Text Overlay Specs

### Layer 1 — Info Labels (Futura Bold, top of screen)

Scene 2 recipe labels (staggered):
- "Tylenol" (fontsize 60, white, borderw 3) at y=h*0.10, appears at scene2_start+0.3s
- "pain & fever" (fontsize 40, gold #FFD700, borderw 3) at y=h*0.10+70
- "Robitussin" (fontsize 60, white, borderw 3) at y=h*0.10+145, appears at scene2_start+2.5s
- "cough" (fontsize 40, gold #FFD700, borderw 3) at y=h*0.10+215
- "Benadryl" (fontsize 60, white, borderw 3) at y=h*0.10+290, appears at scene2_start+5.0s
- "sleep" (fontsize 40, gold #FFD700, borderw 3) at y=h*0.10+360

Scene 3 price comparison:
- "$12" (fontsize 80, red #FF4444, borderw 4) at x=w*0.10, y=h*0.08
- "under $5" (fontsize 80, green #44FF44, borderw 4) at x=w*0.58, y=h*0.08, +1.5s

Scene 4 CTA block (staggered):
- "cold-plan-app.web.app" (fontsize 56, white, borderw 4) at y=h*0.78
- "Every recipe. Every price." (fontsize 44, light blue #AADDFF, borderw 3) at y=h*0.78+66, +1s
- "Free. No login. No ads. No data collected." (fontsize 34, light gray #CCCCCC, borderw 3) at y=h*0.78+126, +2s

### Layer 2 — TikTok Narration Captions (Impact, center screen)

Scene 1 (y=h*0.46):
- "The forty-seven cent" | "NyQuil recipe."

Scene 2 (y=h*0.46):
- "One Tylenol" | "for pain and fever." | "One Robitussin" | "for the cough." | "One Benadryl" | "to knock you out." | "Three pills." | "Same active ingredients," | "same doses," | "same effect." | "The only difference" | "is the green color" | "and the price tag."

Scene 3 (y=h*0.46):
- "A ten-pack of NyQuil" | "costs twelve bucks." | "Thirty doses" | "of the same three generics?" | "Under five dollars."

Scene 4 (y=h*0.30):
- "Cold Plan has the recipe" | "for every brand-name" | "cold medicine." | "Free. No ads." | "Link in bio."

---

## Audio Files to Generate
- audio/01-hook.mp3
- audio/02-recipe.mp3
- audio/03-contrast.mp3
- audio/04-cta.mp3
