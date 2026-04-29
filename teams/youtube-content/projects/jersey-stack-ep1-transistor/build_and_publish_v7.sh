#!/usr/bin/env bash
set -u
# Build the v7 video, upload unlisted to YouTube, write a DONE marker with the URL.
# Designed to run in the background. All status goes to logs; the final payload
# at /tmp/jersey-stack-ep1-v7-DONE.json is what the caller reads to email.

PROJ="/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/jersey-stack-ep1-transistor"
REPO="/Users/nickd/Workspaces/AgentArchitect"
DONE="/tmp/jersey-stack-ep1-v7-DONE.json"
ASM_LOG="$PROJ/assembly/assemble-v7.log"
UP_LOG="$PROJ/output/upload-v7.log"

cd "$PROJ" || exit 99
rm -f "$DONE"

# Stage 1: assembly
echo "[$(date)] Starting v7 assembly…" | tee -a "$ASM_LOG"
python3 assembly/assemble_v7.py >> "$ASM_LOG" 2>&1
ASM_RC=$?
if [ $ASM_RC -ne 0 ]; then
  python3 - <<EOF > "$DONE"
import json, time
print(json.dumps({"stage":"assembly","status":"failed","rc":$ASM_RC,"log":"$ASM_LOG","ts":time.time()}, indent=2))
EOF
  exit $ASM_RC
fi
echo "[$(date)] Assembly OK" >> "$ASM_LOG"

VIDEO="$PROJ/output/jersey-stack-ep1-v7.mp4"
META="$PROJ/output/metadata-v7-upload.json"
THUMB="$PROJ/output/jersey-stack-ep1-v4-thumb.jpg"

if [ ! -f "$VIDEO" ]; then
  python3 - <<EOF > "$DONE"
import json, time
print(json.dumps({"stage":"assembly","status":"failed","reason":"video missing","video":"$VIDEO","log":"$ASM_LOG","ts":time.time()}, indent=2))
EOF
  exit 1
fi

# Stage 2: upload
echo "[$(date)] Starting v7 upload…" | tee -a "$UP_LOG"
# youtube-upload.py prints final JSON to stdout; capture it
UPLOAD_OUT="$(python3 "$REPO/scripts/youtube-upload.py" \
  --metadata "$META" \
  --video "$VIDEO" \
  --thumbnail "$THUMB" 2>>"$UP_LOG")"
UP_RC=$?
echo "$UPLOAD_OUT" | tee -a "$UP_LOG"

if [ $UP_RC -ne 0 ]; then
  python3 - <<EOF > "$DONE"
import json, time
print(json.dumps({"stage":"upload","status":"failed","rc":$UP_RC,"log":"$UP_LOG","ts":time.time()}, indent=2))
EOF
  exit $UP_RC
fi

# Stage 3: parse upload JSON, augment, write DONE marker
python3 - "$VIDEO" "$ASM_LOG" "$UP_LOG" "$DONE" <<'PY'
import json, os, sys, time, subprocess
video, asm_log, up_log, done = sys.argv[1:5]
upload_json = None
with open(up_log) as f:
    log = f.read()
# scan log lines from end for first valid JSON object
buf = []
for line in reversed(log.splitlines()):
    buf.insert(0, line)
    chunk = "\n".join(buf)
    if "video_id" in chunk and chunk.strip().endswith("}"):
        try:
            start = chunk.rindex("{")
            upload_json = json.loads(chunk[start:])
            break
        except Exception:
            continue
size_mb = os.path.getsize(video)/1024/1024
dur = subprocess.run(["ffprobe","-v","quiet","-show_entries","format=duration","-of","csv=p=0",video],
                     capture_output=True, text=True).stdout.strip()
payload = {
    "stage": "complete",
    "status": "ok",
    "video_path": video,
    "video_size_mb": round(size_mb,1),
    "video_duration_seconds": float(dur) if dur else None,
    "upload": upload_json or {"status":"unknown — see log","log":up_log},
    "asm_log": asm_log,
    "up_log": up_log,
    "ts": time.time(),
}
with open(done, "w") as f:
    json.dump(payload, f, indent=2)
print(json.dumps(payload, indent=2))
PY
echo "[$(date)] DONE" | tee -a "$UP_LOG"
