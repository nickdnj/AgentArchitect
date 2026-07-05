#!/usr/bin/env python3
"""Adopt the 4 approved candidate takes (seg-01/02/03/05) into the episode.
Keeps seg-04/06/07 from v24. No new ElevenLabs calls — just swap WAVs + reconcat.

  - backs up current seg-01/02/03/05.wav -> *.v24-take-backup.wav
  - copies <slug>-candidate.wav -> <slug>.wav
  - concatenates all 7 WAVs in order -> raw mp3 -> atempo 1.06 -> episode-vo.mp3
  - writes durations.json (backs up prior)
"""
import subprocess, json, shutil
from pathlib import Path

AUD = Path("/Users/nickd/Workspaces/AgentArchitect/teams/podcast-studio/projects/donkey-kong-infoage/assets/audio")
ATEMPO = 1.06
ORDER = ["seg-01-intro","seg-02-sandhill","seg-03-whattheywerehiding","seg-04-hexdump",
         "seg-05-ikegami","seg-06-lawsuit","seg-07-close"]
ADOPT = ["seg-01-intro","seg-02-sandhill","seg-03-whattheywerehiding","seg-05-ikegami"]

def dur(p):
    r = subprocess.run(["ffprobe","-v","quiet","-show_entries","format=duration","-of","csv=p=0",str(p)],
                       capture_output=True, text=True)
    try: return float(r.stdout.strip())
    except Exception: return None

# back up + adopt
for slug in ADOPT:
    cur = AUD/f"{slug}.wav"; cand = AUD/f"{slug}-candidate.wav"; bak = AUD/f"{slug}.v24-take-backup.wav"
    if not cand.exists():
        raise SystemExit(f"MISSING candidate: {cand}")
    if cur.exists() and not bak.exists():
        shutil.copy2(cur, bak); print(f"backed up {slug}.wav -> {bak.name}")
    shutil.copy2(cand, cur); print(f"adopted {cand.name} -> {slug}.wav  ({dur(cur):.2f}s)")

for name in ("episode-vo.mp3","durations.json"):
    src=AUD/name; bak=AUD/name.replace(".",".v24-take-backup.",1)
    if src.exists() and not bak.exists():
        shutil.copy2(src,bak); print(f"backed up {name} -> {bak.name}")

# verify all 7
durs={}
for slug in ORDER:
    d=dur(AUD/f"{slug}.wav")
    if not d or d<=0: raise SystemExit(f"MISSING/ZERO {slug}.wav")
    durs[slug]=round(d,2)
print("\nsegment WAVs:")
for slug in ORDER:
    tag=" <-- adopted candidate" if slug in ADOPT else " (v24)"
    print(f"  {slug:<30} {durs[slug]:>8.2f}s{tag}")

# concat -> atempo -> episode-vo.mp3
cl=AUD/"_concat_v25.txt"; cl.write_text("".join(f"file '{AUD/slug}.wav'\n" for slug in ORDER))
craw=AUD/"episode-vo-concat-raw-v25.mp3"
subprocess.run(["ffmpeg","-y","-f","concat","-safe","0","-i",str(cl),"-codec:a","libmp3lame","-q:a","2",str(craw)],
               capture_output=True,text=True); cl.unlink(missing_ok=True)
raw_total=dur(craw)
final=AUD/"episode-vo.mp3"
subprocess.run(["ffmpeg","-y","-i",str(craw),"-af",f"atempo={ATEMPO}","-codec:a","libmp3lame","-q:a","2",str(final)],
               capture_output=True,text=True); craw.unlink(missing_ok=True)
final_d=dur(final)

out={}
for slug in ORDER:
    out[slug]=durs[slug]; out[f"{slug}_post_atempo"]=round(durs[slug]/ATEMPO,2)
out["_total"]=round(final_d or 0,2); out["_total_pre_atempo"]=round(raw_total or 0,2)
out["_atempo"]=ATEMPO; out["_tts_speed"]=1.12; out["_voice"]="Nick 2 / 6SxuwKUiBpZjFTc06v9Y"
out["_script_rev"]="v22 (cleaner flowed takes; Nick's comma/line edits for seg-01/02/03/05)"
out["_surgical"]="adopted approved candidate takes for seg-01/02/03/05; seg-04/06/07 from v24"
(AUD/"durations.json").write_text(json.dumps(out,indent=2))

mm=int((final_d or 0)//60)
print(f"\nepisode-vo.mp3 = {final_d:.2f}s ({mm}:{(final_d or 0)-60*mm:05.2f})")
print("post-atempo per segment:")
for slug in ORDER:
    print(f"  {slug:<30} {round(durs[slug]/ATEMPO,2):>8.2f}s")
