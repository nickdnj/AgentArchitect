#!/usr/bin/env python3
"""
Assemble the VCF Comdyna GP-6 short v3 — REAL FOOTAGE over the locked narration.
- Real on-site clips (photos/shot*.mp4) trimmed to each locked scene duration
- One still (Apollo graphic s6b.png) kept as a Ken Burns beat
- Impact text overlays burned at assembly (same look as the locked previz)
- Per-scene narration (assets/audio-nick) drives exact timing
Output: build/comdyna-real-silent.mp4  ->  score_draft.py mixes the locked audio.
"""
import json, subprocess, os
from pathlib import Path

PROJ = Path("/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/vcf-comdyna-short")
IMG = PROJ / "assets" / "images"
VID = PROJ / "photos"
AUD = PROJ / "assets" / os.environ.get("AUD_SUB", "audio-nick")
BUILD = PROJ / "build"
BUILD.mkdir(exist_ok=True)
W, H, FPS = 1080, 1920, 30
OUTRO_TAIL = 3.0

FONT = "/System/Library/Fonts/Supplemental/Impact.ttf"
if not os.path.exists(FONT):
    FONT = "/System/Library/Fonts/Helvetica.ttc"
EQFONT = "/System/Library/Fonts/Supplemental/Times New Roman.ttf"
for cand in ("/System/Library/Fonts/Supplemental/Times New Roman.ttf",
             "/System/Library/Fonts/Supplemental/Georgia.ttf",
             "/System/Library/Fonts/Times.ttc"):
    if os.path.exists(cand):
        EQFONT = cand; break

d = {int(k): float(v) for k, v in json.loads((AUD / "durations.json").read_text()).items()}
S5 = d[5]; s5a = round(S5 * 0.52, 3); s5b = round(S5 - s5a, 3)
S6 = d[6]; s6a = round(S6 * 0.48, 3); s6b = round(S6 - s6a, 3)
S7 = d[7]; s7a = round(S7 * 0.50, 3); s7b = round(S7 - s7a, 3)

# kind: "v"=video clip (src,in), "i"=still image (src)
# (kind, src, in_point, duration, overlay text, equation)
SEGMENTS = [
    ("v", "shot2-scope-morph.mp4",   1.0,  d[1], "THIS 1970s BOX SOLVES\nTHIS EQUATION...", "d²y / dt² = -g"),
    ("v", "shot1-wide-context.mp4",  2.0,  d[2], "...FASTER THAN\nYOUR LAPTOP", ""),
    ("v", "shot4-patchcords.mp4",    0.0,  d[3], "NO CHIP.\nNO CODE.\nNO SOFTWARE.", ""),
    ("v", "shot3-panel-gravity.mp4", 2.5,  d[4], "YOU PROGRAM IT\nWITH KNOBS", ""),
    ("v", "shot2-scope-morph.mp4",   1.5,  s5a,  "LESS GRAVITY =\nTHE MOON", ""),
    ("v", "shot2-scope-morph.mp4",   5.5,  s5b,  "MORE GRAVITY =\nIT SLAMS DOWN", ""),
    ("v", "shot1-wide-context.mp4",  10.0, s6a,  "IT BECOMES\nTHE MOTION", ""),
    ("i", "s6b.png",                 0.0,  s6b,  "APOLLO. MISSILES.\n30 YEARS.", ""),
    ("v", "shot6-gallery-1940s.mp4", 0.0,  s7a,  "IT'S IN\nWALL, NEW JERSEY", ""),
    ("v", "shot5-hand-on-panel.mp4", 1.0,  s7b,  "RUN BY\nVOLUNTEERS", ""),
]

_lc = [0]
def lines_drawtext(text, font, size, color, ystart_expr, fade=0.35, lh=None):
    lh = lh or int(size * 1.18)
    parts = []
    for k, ln in enumerate(text.split("\n")):
        _lc[0] += 1
        f = BUILD / f"_t{_lc[0]}.txt"; f.write_text(ln)
        base = f"({ystart_expr})+{k*lh}"
        if fade:
            y = f"'{base}+if(lt(t,{fade}),(1-t/{fade})*36,0)'"
            a = f":alpha='if(lt(t,{fade}),t/{fade},1)'"
        else:
            y = base; a = ""
        parts.append(
            f"drawtext=fontfile='{font}':textfile='{f}':fontcolor={color}:fontsize={size}:"
            f"borderw=10:bordercolor=black@0.92:x=(w-text_w)/2:y={y}{a}")
    return ",".join(parts)

def overlay_chain(text, eq):
    eq_dt = ""
    if eq:
        _lc[0] += 1
        eqf = BUILD / f"_t{_lc[0]}.txt"; eqf.write_text(eq)
        eq_dt = (
            f"drawtext=fontfile='{EQFONT}':textfile='{eqf}':fontcolor=0x7CFFB0:fontsize=66:"
            f"borderw=6:bordercolor=black@0.85:x=(w-text_w)/2:y=h*0.20:"
            f"alpha='if(lt(t,0.5),0,if(lt(t,0.9),(t-0.5)/0.4,1))',")
    body = lines_drawtext(text, FONT, 78, "white", "h*0.66")
    return f"{eq_dt}{body}"

ENC = ["-c:v","libx264","-preset","medium","-crf","20","-pix_fmt","yuv420p",
       "-r",str(FPS),"-video_track_timescale","30000"]

def video_clip(src, t_in, dur, text, eq, out):
    vf = (f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,"
          f"{overlay_chain(text, eq)},format=yuv420p")
    subprocess.run(["ffmpeg","-y","-ss",f"{t_in}","-i",str(src),"-t",f"{dur}",
                    "-vf",vf,"-an",*ENC,str(out)], check=True, capture_output=True)

def still_clip(src, dur, text, eq, out):
    frames = max(1, round(dur * FPS))
    CW, CH = 1296, 2304
    z = f"min(1.0+0.10*on/{frames},1.10)"
    vf = (f"scale={CW}:{CH}:force_original_aspect_ratio=increase,crop={CW}:{CH},"
          f"zoompan=z='{z}':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},"
          f"{overlay_chain(text, eq)},format=yuv420p")
    subprocess.run(["ffmpeg","-y","-loop","1","-framerate",str(FPS),"-i",str(src),
                    "-vf",vf,"-frames:v",str(frames),*ENC,str(out)], check=True, capture_output=True)

def endcard_clip(dur, out):
    big = lines_drawtext("COME TURN THE\nKNOB YOURSELF", FONT, 92, "white", "h*0.38", fade=0.3)
    sub = lines_drawtext("VCF MUSEUM @ INFOAGE   |   WALL, NJ\nON THE FORMER ARMY SIGNAL CORPS BASE\nOPEN WEEKENDS   |   INFOAGE.ORG",
                         FONT, 38, "0x9fb4d8", "h*0.64", fade=0)
    vf = (f"drawbox=x=(iw-360)/2:y=ih*0.575:w=360:h=8:color=0x2ecc71:t=fill,{big},{sub},format=yuv420p")
    subprocess.run(["ffmpeg","-y","-f","lavfi","-t",f"{dur}",
                    "-i",f"color=c=0x13294b:s={W}x{H}:r={FPS}","-vf",vf,*ENC,str(out)],
                   check=True, capture_output=True)

clips = []
for i, (kind, src, t_in, dur, text, eq) in enumerate(SEGMENTS, 1):
    out = BUILD / f"rclip-{i:02d}.mp4"
    print(f"  clip {i:02d} [{kind}]: {src}  {dur:.2f}s")
    if kind == "v":
        video_clip(VID / src, t_in, dur, text, eq, out)
    else:
        still_clip(IMG / src, dur, text, eq, out)
    clips.append(out)

ec = BUILD / "rclip-11-endcard.mp4"
print(f"  endcard: {d[8]:.2f}s (+{OUTRO_TAIL}s tail)")
endcard_clip(d[8] + OUTRO_TAIL, ec)
clips.append(ec)

listf = BUILD / "concat-real.txt"
listf.write_text("".join(f"file '{c.name}'\n" for c in clips))
silent = BUILD / "video-silent.mp4"   # score_draft.py reads this name
subprocess.run(["ffmpeg","-y","-f","concat","-safe","0","-i",str(listf),
                "-c","copy",str(silent)], check=True, capture_output=True, cwd=str(BUILD))

dur = subprocess.run(["ffprobe","-v","quiet","-show_entries","format=duration","-of","csv=p=0",str(silent)],
                     capture_output=True, text=True).stdout.strip()
print(f"\nDONE (silent) -> {silent}  ({float(dur):.1f}s)")
