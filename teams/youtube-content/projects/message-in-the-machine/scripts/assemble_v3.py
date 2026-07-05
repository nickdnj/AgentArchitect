#!/usr/bin/env python3
"""Assemble the v3 ending-draft cut directly with ffmpeg. Idempotent per-segment.
Usage:
  python3 assemble_v3.py test   # render only the closing card + segment 0, then exit
  python3 assemble_v3.py        # full render -> exports/...v3-ending-draft.mp4
"""
import json, os, subprocess, sys, math

ROOT = "/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/message-in-the-machine"
MAN  = os.path.join(ROOT, "assembly-manifest-v4.json")
IMGB = os.path.join(ROOT, "assets/images")
AUD  = os.path.join(ROOT, "assets/audio/episode-vo.mp3")
WORK = os.path.join(ROOT, "assembly/segments-v4")
OUT  = os.path.join(ROOT, "exports/the-message-in-the-machine_v17.mp4")
FPS  = 30
os.makedirs(WORK, exist_ok=True)

def log(m):
    print(m, flush=True)
    with open(os.path.join(WORK, "progress.log"), "a") as f:
        f.write(m + "\n")

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        log("FFMPEG ERROR:\n" + " ".join(cmd[:12]) + " ...\n" + r.stderr[-1500:])
        raise SystemExit(1)
    return r

def font(*cands):
    for c in cands:
        if os.path.exists(c):
            return c
    return None

FONT_REG  = font("/System/Library/Fonts/Supplemental/Arial.ttf", "/Library/Fonts/Arial.ttf", "/System/Library/Fonts/Helvetica.ttc")
FONT_BOLD = font("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/Library/Fonts/Arial Bold.ttf", FONT_REG)

# ---------- Ken Burns per-motion zoompan ----------
def kb_filter(motion, dur):
    N = max(1, round(dur * FPS))
    pre = "scale=2400:1350:force_original_aspect_ratio=increase,crop=2400:1350,setsar=1"
    cen_x = "iw/2-(iw/zoom/2)"; cen_y = "ih/2-(ih/zoom/2)"
    if motion in ("push-in", "slow-push-in", "push-in-settle"):
        z = f"1+0.12*on/{N}"; x = cen_x; y = cen_y
    elif motion == "pan-lr":
        z = "1.12"; x = f"(iw-iw/zoom)*on/{N}"; y = cen_y
    elif motion == "pan-down":
        z = "1.12"; x = cen_x; y = f"(ih-ih/zoom)*on/{N}"
    else:  # static-slow / default
        z = f"1+0.04*on/{N}"; x = cen_x; y = cen_y
    zp = f"zoompan=z='{z}':x='{x}':y='{y}':d=1:s=1920x1080:fps={FPS}"
    return f"{pre},{zp},format=yuv420p", N

def render_segment(idx, page):
    seg = os.path.join(WORK, f"seg_{idx:03d}.mp4")
    if os.path.exists(seg) and os.path.getsize(seg) > 10000:
        log(f"  seg {idx:03d} exists, skip"); return seg
    img = os.path.join(IMGB, page["img"])
    dur = float(page["dur"])
    vf, N = kb_filter(page.get("motion", "push-in"), dur)
    run(["ffmpeg","-y","-loop","1","-framerate",str(FPS),"-t",f"{dur:.3f}","-i",img,
         "-vf",vf,"-c:v","libx264","-preset","medium","-crf","19",
         "-pix_fmt","yuv420p","-r",str(FPS),"-t",f"{dur:.3f}",seg])
    log(f"  seg {idx:03d} rendered ({page.get('img').split('/')[-1]}, {dur:.2f}s)")
    return seg

# ---------- Pillarbox (portrait source -> 16:9 with blurred side panels; static hold) ----------
def build_pillarbox_png(page):
    from PIL import Image, ImageFilter
    W, H = 1920, 1080
    img = Image.open(os.path.join(IMGB, page["img"])).convert("RGB")  # pre-baked upright (orient=1)
    # background: cover-crop the same photo, blur + warm-darken -> fills the side panels
    s = max(W / img.width, H / img.height)
    bg = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    bx, by = (bg.width - W) // 2, (bg.height - H) // 2
    bg = bg.crop((bx, by, bx + W, by + H)).filter(ImageFilter.GaussianBlur(40))
    bg = Image.blend(bg, Image.new("RGB", (W, H), (20, 14, 8)), 0.45)
    # foreground: fit full height, centered -> crisp upright portrait with side panels
    s2 = H / img.height
    fw = round(img.width * s2)
    fg = img.resize((fw, H), Image.LANCZOS)
    bg.paste(fg, ((W - fw) // 2, 0))
    out = os.path.join(WORK, f"pillar_{page['n']}.png")
    bg.save(out)
    log(f"  pillarbox png built ({page['img'].split('/')[-1]}, fg {fw}x{H}, side panels {(W-fw)//2}px)")
    return out

def render_pillarbox(idx, page):
    seg = os.path.join(WORK, f"seg_{idx:03d}.mp4")
    if os.path.exists(seg) and os.path.getsize(seg) > 10000:
        log(f"  seg {idx:03d} exists, skip"); return seg
    dur = float(page["dur"])
    png = build_pillarbox_png(page)
    run(["ffmpeg","-y","-loop","1","-framerate",str(FPS),"-t",f"{dur:.3f}","-i",png,
         "-vf","format=yuv420p","-c:v","libx264","-preset","medium","-crf","19",
         "-pix_fmt","yuv420p","-r",str(FPS),"-t",f"{dur:.3f}",seg])
    log(f"  seg {idx:03d} pillarbox rendered ({page.get('img').split('/')[-1]}, {dur:.2f}s)")
    return seg

# ---------- P35 closing card (static composite; NO zoom so map/QR stay in frame) ----------
def build_card_png(page):
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
    L = page["layout"]
    card = os.path.join(WORK, "card35.png")
    W, H = 1920, 1080
    # hero cover-crop
    hero = Image.open(os.path.join(IMGB, page["img"])).convert("RGB")
    scale = max(W/hero.width, H/hero.height)
    hero = hero.resize((round(hero.width*scale), round(hero.height*scale)), Image.LANCZOS)
    x0 = (hero.width - W)//2; y0 = (hero.height - H)//2
    base = hero.crop((x0, y0, x0+W, y0+H))
    # slight overall darken + warm
    base = Image.blend(base, Image.new("RGB",(W,H),(30,20,10)), 0.18)
    # lower scrim gradient (transparent -> dark) over bottom ~55%
    scrim = Image.new("L",(1,H),0)
    for yy in range(H):
        t = max(0.0,(yy-H*0.42)/(H*0.58))
        scrim.putpixel((0,yy), int(210*min(1.0,t)))
    scrim = scrim.resize((W,H))
    dark = Image.new("RGB",(W,H),(0,0,0))
    base = Image.composite(dark, base, scrim)
    draw = ImageDraw.Draw(base)
    def F(path,size):
        try: return ImageFont.truetype(path,size)
        except Exception: return ImageFont.load_default()
    f1 = F(FONT_BOLD,64); f2 = F(FONT_REG,38); f3 = F(FONT_BOLD,50); flab = F(FONT_REG,28)
    def ctext(y, s, fnt, fill=(255,255,255)):
        w = draw.textlength(s, font=fnt); draw.text(((W-w)/2, y), s, font=fnt, fill=fill)
    ctext(740, L["lockup_text"][0], f1)
    ctext(818, L["lockup_text"][1], f2, (230,225,215))
    ctext(864, L["lockup_text"][2], f3, (255,214,140))
    # map inset bottom-left
    mp = Image.open(os.path.join(IMGB,"real/infoage-handout/infoage-location-map.png")).convert("RGB")
    mh = 300; mw = round(mp.width*mh/mp.height); mp = mp.resize((mw,mh), Image.LANCZOS)
    mx, my = 70, H-mh-70
    draw.rectangle([mx-3,my-3,mx+mw+3,my+mh+3], outline=(235,235,235), width=3)
    base.paste(mp,(mx,my))
    # InfoAge arrow/pin on the map (approx Wall Township, NJ coast) — placement approximate
    fx, fy = 0.57, 0.58
    px, py = mx + int(fx*mw), my + int(fy*mh)
    draw.ellipse([px-7,py-7,px+7,py+7], fill=(220,30,30), outline=(255,255,255), width=2)
    lbl = "InfoAge"; lf = F(FONT_BOLD, 22); lw = draw.textlength(lbl, font=lf)
    lpx, lpy = px - lw/2 - 8, py - 46
    draw.rounded_rectangle([lpx, lpy, lpx+lw+16, lpy+30], radius=6, fill=(220,30,30))
    draw.polygon([(px-6, py-16), (px+6, py-16), (px, py-7)], fill=(220,30,30))
    draw.text((lpx+8, lpy+4), lbl, font=lf, fill=(255,255,255))
    # QR bottom-right on white box, native-ish (crisp/scannable)
    qr = Image.open(os.path.join(IMGB,"real/infoage-handout/infoage-qr-directions-googlemaps.png")).convert("RGB")
    pad = 14; qw = qr.width  # keep native (269)
    bx, by = W-qw-pad*2-70, H-qw-pad*2-70
    draw.rectangle([bx,by,bx+qw+pad*2,by+qw+pad*2], fill=(255,255,255))
    base.paste(qr,(bx+pad,by+pad))
    lab = "Scan for directions"; lw = draw.textlength(lab, font=flab)
    draw.text((bx+(qw+pad*2-lw)/2, by-40), lab, font=flab, fill=(255,255,255))
    base.save(card)
    log(f"  card35.png built (QR {qw}px, font={'ok' if FONT_REG else 'default'})")
    return card

def render_card(idx, page):
    seg = os.path.join(WORK, f"seg_{idx:03d}.mp4")
    dur = float(page["dur"])
    card = build_card_png(page)
    if os.path.exists(seg) and os.path.getsize(seg) > 10000:
        return seg
    run(["ffmpeg","-y","-loop","1","-framerate",str(FPS),"-t",f"{dur:.3f}","-i",card,
         "-vf","format=yuv420p","-c:v","libx264","-preset","medium","-crf","18",
         "-pix_fmt","yuv420p","-r",str(FPS),"-t",f"{dur:.3f}",seg])
    log(f"  seg {idx:03d} closing card rendered ({dur:.2f}s)")
    return seg

def main():
    man = json.load(open(MAN))
    pages = man["pages"]
    test = len(sys.argv) > 1 and sys.argv[1] == "test"
    open(os.path.join(WORK,"progress.log"),"w").close()
    log(f"assemble_v3 start ({'TEST' if test else 'FULL'}), {len(pages)} pages")
    if test:
        render_card(len(pages)-1, pages[-1])
        render_segment(0, pages[0])
        log("TEST done"); return
    segs = []
    for i, p in enumerate(pages):
        if p.get("closing_card"):
            segs.append(render_card(i, p))
        elif p.get("pillarbox"):
            segs.append(render_pillarbox(i, p))
        else:
            segs.append(render_segment(i, p))
    concat = os.path.join(WORK,"concat.txt")
    with open(concat,"w") as f:
        for s in segs: f.write(f"file '{s}'\n")
    silent = os.path.join(WORK,"silent.mp4")
    log("concatenating segments...")
    run(["ffmpeg","-y","-f","concat","-safe","0","-i",concat,"-c","copy",silent])
    log("muxing audio -> final...")
    run(["ffmpeg","-y","-i",silent,"-i",AUD,"-map","0:v:0","-map","1:a:0",
         "-c:v","copy","-c:a","aac","-b:a","192k","-movflags","+faststart","-shortest",OUT])
    dur = subprocess.run(["ffprobe","-v","0","-show_entries","format=duration",
                          "-of","csv=p=0",OUT],capture_output=True,text=True).stdout.strip()
    sz = os.path.getsize(OUT)//(1024*1024)
    log(f"DONE -> {OUT}  ({float(dur):.1f}s, {sz}MB)")

if __name__ == "__main__":
    main()
