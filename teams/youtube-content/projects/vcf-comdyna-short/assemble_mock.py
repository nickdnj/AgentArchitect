#!/usr/bin/env python3
"""
Assemble the VCF Comdyna GP-6 short ANIMATIC MOCK.
- Stand-in images (assets/images) -> 1080x1920 Ken Burns clips
- Impact text overlays burned at assembly (never into the source images)
- Per-scene narration (assets/audio) drives exact timing
Output: build/comdyna-short-mock.mp4
"""
import json, subprocess, os
from pathlib import Path

PROJ = Path("/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/vcf-comdyna-short")
IMG = PROJ / "assets" / "images"
AUD = PROJ / "assets" / os.environ.get("AUD_SUB", "audio")
BUILD = PROJ / "build"
BUILD.mkdir(exist_ok=True)
W, H, FPS = 1080, 1920, 30
OUTRO_TAIL = 3.0  # hold the end card after the last word so the music can trail off (fixes abrupt ending)

FONT = "/System/Library/Fonts/Supplemental/Impact.ttf"
if not os.path.exists(FONT):
    FONT = "/System/Library/Fonts/Helvetica.ttc"
# Serif font for the equation graphic (has ² glyph)
EQFONT = "/System/Library/Fonts/Supplemental/Times New Roman.ttf"
for cand in ("/System/Library/Fonts/Supplemental/Times New Roman.ttf",
             "/System/Library/Fonts/Supplemental/Georgia.ttf",
             "/System/Library/Fonts/Times.ttc"):
    if os.path.exists(cand):
        EQFONT = cand; break

durations = json.loads((AUD / "durations.json").read_text())
d = {int(k): float(v) for k, v in durations.items()}

# scene -> (image, overlay text). Scene 5 is split across two arc frames.
S5 = d[5]; s5a_t = round(S5 * 0.52, 2); s5b_t = round(S5 - s5a_t, 2)
S6 = d[6]; s6a_t = round(S6 * 0.48, 2); s6b_t = round(S6 - s6a_t, 2)
# (image, duration, overlay text, equation-graphic-or-empty)
SEGMENTS = [
    ("s1.png",  d[1], "THIS 1970s BOX SOLVES\nTHIS EQUATION...", "d²y / dt² = −g"),
    ("s2.png",  d[2], "...FASTER THAN\nYOUR LAPTOP", ""),
    ("s3.png",  d[3], "NO CHIP.\nNO CODE.\nNO SOFTWARE.", ""),
    ("s4.png",  d[4], "YOU PROGRAM IT\nWITH KNOBS", ""),
    ("s5a.png", s5a_t, "LESS GRAVITY =\nTHE MOON", ""),
    ("s5b.png", s5b_t, "MORE GRAVITY =\nIT SLAMS DOWN", ""),
    ("s6.png",  s6a_t, "IT BECOMES\nTHE MOTION", ""),
    ("s6b.png", s6b_t, "APOLLO. MISSILES.\n30 YEARS.", ""),
    ("s7.png",  d[7], "IT'S IN\nWALL, NEW JERSEY", ""),
]

_lc = [0]
def lines_drawtext(text, font, size, color, ystart_expr, fade=0.35, lh=None):
    """One drawtext per line (avoids ffmpeg8 textfile-newline tofu). Lines stacked vertically."""
    lh = lh or int(size * 1.18)
    parts = []
    for k, ln in enumerate(text.split("\n")):
        _lc[0] += 1
        f = BUILD / f"_t{_lc[0]}.txt"; f.write_text(ln)
        base = f"({ystart_expr})+{k*lh}"
        if fade:
            # pop-up: text rises ~36px and fades in over `fade` seconds
            y = f"'{base}+if(lt(t,{fade}),(1-t/{fade})*36,0)'"
            a = f":alpha='if(lt(t,{fade}),t/{fade},1)'"
        else:
            y = base; a = ""
        parts.append(
            f"drawtext=fontfile='{font}':textfile='{f}':fontcolor={color}:fontsize={size}:"
            f"borderw=10:bordercolor=black@0.92:x=(w-text_w)/2:y={y}{a}")
    return ",".join(parts)

def kenburns_clip(img, dur, text, out, zoom_in=True, eq=""):
    frames = max(1, round(dur * FPS))
    CW, CH = 1296, 2304  # modest zoom headroom (1.2x) -> much cheaper than 1.5x
    z = (f"min(1.0+0.12*on/{frames},1.12)" if zoom_in else f"max(1.12-0.12*on/{frames},1.0)")
    eq_dt = ""
    if eq:
        _lc[0] += 1
        eqf = BUILD / f"_t{_lc[0]}.txt"; eqf.write_text(eq)
        eq_dt = (
            f"drawtext=fontfile='{EQFONT}':textfile='{eqf}':fontcolor=0x7CFFB0:fontsize=66:"
            f"borderw=6:bordercolor=black@0.85:x=(w-text_w)/2:y=h*0.20:"
            f"alpha='if(lt(t,0.5),0,if(lt(t,0.9),(t-0.5)/0.4,1))',"
        )
    body = lines_drawtext(text, FONT, 78, "white", "h*0.66")
    vf = (
        f"scale={CW}:{CH}:force_original_aspect_ratio=increase,"
        f"crop={CW}:{CH},"
        f"zoompan=z='{z}':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},"
        f"{eq_dt}{body},format=yuv420p"
    )
    # -frames:v caps output to EXACTLY `frames` (fixes zoompan over-generation); no -t on input.
    subprocess.run(["ffmpeg","-y","-loop","1","-framerate",str(FPS),
                    "-i",str(img),"-vf",vf,"-frames:v",str(frames),"-r",str(FPS),
                    "-c:v","libx264","-preset","ultrafast","-crf","23","-pix_fmt","yuv420p",
                    str(out)], check=True, capture_output=True)

def endcard_clip(dur, out):
    big = lines_drawtext("COME TURN THE\nKNOB YOURSELF", FONT, 92, "white", "h*0.38", fade=0.3)
    sub = lines_drawtext("VCF MUSEUM @ INFOAGE   |   WALL, NJ\nON THE FORMER ARMY SIGNAL CORPS BASE\nOPEN WEEKENDS   |   INFOAGE.ORG",
                         FONT, 38, "0x9fb4d8", "h*0.64", fade=0)
    vf = (
        f"drawbox=x=(iw-360)/2:y=ih*0.575:w=360:h=8:color=0x2ecc71:t=fill,"
        f"{big},{sub},format=yuv420p"
    )
    subprocess.run(["ffmpeg","-y","-f","lavfi","-t",f"{dur}",
                    "-i",f"color=c=0x13294b:s={W}x{H}:r={FPS}","-vf",vf,
                    "-c:v","libx264","-preset","ultrafast","-crf","23","-pix_fmt","yuv420p",
                    str(out)], check=True, capture_output=True)

clips = []
for i, (img, dur, text, eq) in enumerate(SEGMENTS, 1):
    out = BUILD / f"clip-{i:02d}.mp4"
    print(f"  clip {i:02d}: {img}  {dur:.2f}s")
    kenburns_clip(IMG / img, dur, text, out, zoom_in=(i % 2 == 1), eq=eq)
    clips.append(out)

ec = BUILD / "clip-09-endcard.mp4"
print(f"  endcard: {d[8]:.2f}s")
endcard_clip(d[8] + OUTRO_TAIL, ec)
clips.append(ec)

# concat (re-encode-safe via concat demuxer; all clips share params)
listf = BUILD / "concat.txt"
listf.write_text("".join(f"file '{c.name}'\n" for c in clips))
silent = BUILD / "video-silent.mp4"
subprocess.run(["ffmpeg","-y","-f","concat","-safe","0","-i",str(listf),
                "-c","copy",str(silent)], check=True, capture_output=True, cwd=str(BUILD))

# mux narration
out = BUILD / "comdyna-short-mock.mp4"
subprocess.run(["ffmpeg","-y","-i",str(silent),"-i",str(AUD/"narration.mp3"),
                "-c:v","copy","-c:a","aac","-b:a","192k","-shortest",str(out)],
               check=True, capture_output=True)

dur = subprocess.run(["ffprobe","-v","quiet","-show_entries","format=duration","-of","csv=p=0",str(out)],
                     capture_output=True, text=True).stdout.strip()
print(f"\nDONE -> {out}  ({float(dur):.1f}s)")
