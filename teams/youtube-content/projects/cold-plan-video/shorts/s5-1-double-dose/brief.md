# S5-1: You Might Be Double-Dosing Right Now

## Series: The Stuff Nobody Tells You
## Format: 9:16 vertical (1080x1920), ~30-35 seconds

---

## Narration Script (ElevenLabs Josh voice)

**Scene 1 — HOOK (0-3s):**
"If you take NyQuil and Tylenol together, you're double-dosing on the same drug."

**Scene 2 — THE DANGER (4-15s):**
"NyQuil already has Tylenol in it. Same with DayQuil. Same with Theraflu. If you pop a Tylenol on top of any of those, you're taking twice the acetaminophen. And too much acetaminophen is the number one cause of liver failure in the US."

**Scene 3 — THE FIX (16-24s):**
"This is why you need to know what's actually in your cold medicine. Not the brand name. The ingredients."

**Scene 4 — CTA (25-35s):**
"Cold Plan breaks down every brand-name cold medicine so you know exactly what you're taking. Link in bio."

---

## Image Prompts (gpt-image-1, Falore style, 1024x1536, NO TEXT IN IMAGES)

**01-hook.png:**
Warm editorial illustration in Falore style — hand-drawn sketch with visible brush textures, warm amber and cream palette. A dramatic close-up of two hands: one holding a NyQuil liquid cap, the other holding a Tylenol tablet, about to take both at the same time. A subtle red warning glow or danger aura around both pills. Tense, cautionary mood. No text anywhere in the image.

**02-danger.png:**
Warm editorial illustration in Falore style. Three branded boxes (NyQuil, DayQuil, Theraflu) arranged in a row, each with a ghostly Tylenol pill floating above or overlaid on top — revealing the hidden ingredient they all share. Visual metaphor: the same drug hiding in plain sight across multiple products. Warm amber tones with a hint of red warning. No text anywhere in the image.

**03-fix.png:**
Warm editorial illustration in Falore style. A person holding a cold medicine box up close to their face, squinting at the back label — the active ingredients panel. Magnifying glass or spotlight effect on the ingredients section. The visual says "read the fine print." Warm amber palette. No text anywhere in the image.

**04-cta-phone.png:**
Warm editorial illustration in Falore style. A hand holding a smartphone showing the Cold Plan app with a drug interaction or ingredient overlap warning visible on screen. Warm amber background. No text anywhere in the image.

---

## Text Overlay Specs

### Layer 1 — Info Labels (Futura Bold)

Scene 2 hidden ingredient reveals (staggered):
- "NyQuil" (fontsize 60, white, borderw 3) at y=h*0.10, appears at scene2_start+0.3s
- "contains Tylenol" (fontsize 40, red #FF4444, borderw 3) at y=h*0.10+70
- "DayQuil" (fontsize 60, white, borderw 3) at y=h*0.10+145, appears at scene2_start+2.0s
- "contains Tylenol" (fontsize 40, red #FF4444, borderw 3) at y=h*0.10+215
- "Theraflu" (fontsize 60, white, borderw 3) at y=h*0.10+290, appears at scene2_start+3.5s
- "contains Tylenol" (fontsize 40, red #FF4444, borderw 3) at y=h*0.10+360

Scene 4 CTA block (staggered):
- "cold-plan-app.web.app" (fontsize 56, white, borderw 4) at y=h*0.78
- "Know what you're taking." (fontsize 44, light blue #AADDFF, borderw 3) at y=h*0.78+66, +1s
- "Free. No login. No ads. No data collected." (fontsize 34, light gray #CCCCCC, borderw 3) at y=h*0.78+126, +2s

### Layer 2 — TikTok Narration Captions (Impact, center screen)

Scene 1 (y=h*0.46): "If you take NyQuil" | "and Tylenol together," | "you're double-dosing" | "on the same drug."
Scene 2 (y=h*0.46): "NyQuil already" | "has Tylenol in it." | "Same with DayQuil." | "Same with Theraflu." | "If you pop a Tylenol" | "on top of any of those," | "twice the acetaminophen." | "And too much" | "is the number one cause" | "of liver failure" | "in the US."
Scene 3 (y=h*0.46): "This is why" | "you need to know" | "what's actually in" | "your cold medicine." | "Not the brand name." | "The ingredients."
Scene 4 (y=h*0.30): "Cold Plan breaks down" | "every brand-name" | "cold medicine" | "so you know exactly" | "what you're taking." | "Link in bio."

## Audio Files: audio/01-hook.mp3, audio/02-danger.mp3, audio/03-fix.mp3, audio/04-cta.mp3
