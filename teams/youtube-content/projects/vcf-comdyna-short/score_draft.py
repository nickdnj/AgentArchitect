#!/usr/bin/env python3
"""
Score the Comdyna animatic into a v1 DRAFT short:
  - FFmpeg synth music bed (house method) that BRIGHTENS at the centerpiece
  - light SFX: hook sub-boom, morph whoosh, end-card resolve hit
  - mix narration (foreground) + bed (ducked) + sfx -> remux over the silent video
Output: build/comdyna-short-draft-v1.mp4
"""
import json, subprocess, os
from pathlib import Path

PROJ = Path("/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/vcf-comdyna-short")
AUD = PROJ / "assets" / os.environ.get("AUD_SUB", "audio")
MUS = AUD / "music"; SFX = AUD / "sfx"; BUILD = PROJ / "build"
for p in (MUS, SFX): p.mkdir(parents=True, exist_ok=True)

d = {int(k): float(v) for k, v in json.loads((AUD / "durations.json").read_text()).items()}
MORPH = sum(d[i] for i in (1,2,3,4))      # scene 5 (centerpiece) start
ENDCARD = MORPH + d[5] + d[6] + d[7]       # end card start
TOTAL = sum(d.values())
OUTRO_TAIL = 3.0                              # music trails off past the last word (matches assemble_mock)
D = round(TOTAL + OUTRO_TAIL + 0.3, 2)

def run(args): subprocess.run(args, check=True, capture_output=True)

# --- music bed: dark confident pad + a bright layer that swells over the morph ---
bed = MUS / "bed.wav"
run(["ffmpeg","-y",
    "-f","lavfi","-i",f"sine=frequency=65.41:duration={D}",   # C2
    "-f","lavfi","-i",f"sine=frequency=196:duration={D}",     # G3
    "-f","lavfi","-i",f"sine=frequency=261.63:duration={D}",  # C4
    "-f","lavfi","-i",f"sine=frequency=32.7:duration={D}",    # C1 bass
    "-f","lavfi","-i",f"sine=frequency=523.25:duration={D}",  # C5 bright
    "-f","lavfi","-i",f"sine=frequency=392:duration={D}",     # G4 bright
    "-filter_complex",
    "[0:a]volume=0.30,lowpass=f=220[c2];"
    "[1:a]volume=0.20,lowpass=f=650[g3];"
    "[2:a]volume=0.22,lowpass=f=850[c4];"
    "[3:a]volume=0.12,lowpass=f=100[bass];"
    # bright partials only audible across the centerpiece morph:
    f"[4:a]volume=0.16,afade=t=in:st={MORPH-2}:d=2.5,afade=t=out:st={MORPH+d[5]-2}:d=3[c5];"
    f"[5:a]volume=0.14,afade=t=in:st={MORPH-2}:d=2.5,afade=t=out:st={MORPH+d[5]-2}:d=3[g4];"
    "[c2][g3][c4][bass][c5][g4]amix=inputs=6:duration=longest:normalize=0,"
    "aecho=0.8:0.7:450|900:0.25|0.18,lowpass=f=2200,"
    f"afade=t=in:st=0:d=3,afade=t=out:st={TOTAL}:d={OUTRO_TAIL},"
    "volume=30dB,alimiter=limit=0.7",
    str(bed)])

# --- SFX ---
boom = SFX / "boom.wav"
run(["ffmpeg","-y","-f","lavfi","-i","sine=frequency=48:duration=0.8",
     "-af","afade=t=out:st=0.15:d=0.6,volume=0.9",str(boom)])

whoosh = SFX / "whoosh.wav"
run(["ffmpeg","-y","-f","lavfi","-i","anoisesrc=d=1.8:c=pink:a=0.5",
     "-af","highpass=f=350,lowpass=f=3500,afade=t=in:d=1.0,afade=t=out:st=1.0:d=0.8,volume=0.7",
     str(whoosh)])

resolve = SFX / "resolve.wav"
run(["ffmpeg","-y",
     "-f","lavfi","-i","sine=frequency=261.63:duration=1.4",
     "-f","lavfi","-i","sine=frequency=329.63:duration=1.4",
     "-f","lavfi","-i","sine=frequency=392:duration=1.4",
     "-filter_complex","[0][1][2]amix=inputs=3:normalize=0,afade=t=out:st=0.3:d=1.1,volume=0.5",
     str(resolve)])

click = SFX / "click.wav"   # patch-cord plug (scene 3)
run(["ffmpeg","-y","-f","lavfi","-i","anoisesrc=d=0.12:c=pink:a=0.6",
     "-af","highpass=f=900,lowpass=f=6500,afade=t=out:st=0.02:d=0.09,volume=0.85",str(click)])
tick = SFX / "tick.wav"     # knob detent (scene 4)
run(["ffmpeg","-y","-f","lavfi","-i","anoisesrc=d=0.07:c=pink:a=0.5",
     "-af","highpass=f=600,lowpass=f=2600,afade=t=out:st=0.01:d=0.05,volume=0.7",str(tick)])

# --- final mix: VO (full) + bed (low) + timed sfx, then remux over silent video ---
silent = BUILD / "video-silent.mp4"
out = BUILD / os.environ.get("OUT", "comdyna-short-draft-v1.mp4")
b_ms = int(0.30*1000)
w_ms = int(MORPH*1000)
r_ms = int(ENDCARD*1000)
c_ms = int((d[1]+d[2])*1000)          # scene 3 onset -> patch-cord click
t_ms = int((d[1]+d[2]+d[3])*1000)     # scene 4 onset -> knob tick
run(["ffmpeg","-y",
     "-i",str(silent),
     "-i",str(AUD/"narration.mp3"),
     "-i",str(bed),
     "-i",str(boom),
     "-i",str(whoosh),
     "-i",str(resolve),
     "-i",str(click),
     "-i",str(tick),
     "-filter_complex",
     # duck the music under the VO (sidechain) so it sits behind the voice
     "[1:a]asplit=2[vo][vok0];"
     f"[vok0]apad=whole_dur={D}[vokey];"   # pad key to full length so duck doesn't truncate the music tail
     "[2:a]volume=0.32[musraw];"
     "[musraw][vokey]sidechaincompress=threshold=0.03:ratio=6:attack=5:release=260[mus];"
     f"[3:a]adelay={b_ms}|{b_ms},volume=0.6[bo];"
     f"[4:a]adelay={w_ms}|{w_ms},volume=0.5[wh];"
     f"[5:a]adelay={r_ms}|{r_ms},volume=0.5[re];"
     f"[6:a]adelay={c_ms}|{c_ms},volume=0.45[ck];"
     f"[7:a]adelay={t_ms}|{t_ms},volume=0.4[tk];"
     "[vo][mus][bo][wh][re][ck][tk]amix=inputs=7:duration=longest:normalize=0,alimiter=limit=0.95[a]",
     "-map","0:v","-map","[a]","-c:v","copy","-c:a","aac","-b:a","192k","-shortest",str(out)])

dur = subprocess.run(["ffprobe","-v","quiet","-show_entries","format=duration","-of","csv=p=0",str(out)],
                     capture_output=True, text=True).stdout.strip()
print(f"morph@{MORPH:.1f}s  endcard@{ENDCARD:.1f}s")
print(f"DONE -> {out}  ({float(dur):.1f}s)")
