#!/bin/bash
# Reusable assembly script for Cold Plan Shorts
# Usage: bash assemble-short.sh <short-dir> <overlay-file>
set -e

BASE="$1"
OVERLAY="$2"
OUT="$BASE/output"
IMG="$BASE/images"
AUD="$BASE/audio"
mkdir -p "$OUT"

PAD=0.8

DUR1=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/01-hook.mp3")
DUR2=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/02-ingredients.mp3")
DUR3=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/03-math.mp3")
DUR4=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/04-cta.mp3")

SCENE1=$(echo "$DUR1 + $PAD" | bc)
SCENE2=$(echo "$DUR2 + $PAD" | bc)
SCENE3=$(echo "$DUR3 + $PAD" | bc)
SCENE4=$(echo "$DUR4 + $PAD + 0.5" | bc)

T2=$(echo "$SCENE1" | bc)
T3=$(echo "$T2 + $SCENE2" | bc)
T4=$(echo "$T3 + $SCENE3" | bc)
TOTAL=$(echo "$T4 + $SCENE4" | bc)

echo "Durations: $DUR1 $DUR2 $DUR3 $DUR4"
echo "Scenes: $SCENE1 $SCENE2 $SCENE3 $SCENE4"
echo "Timeline: T2=$T2 T3=$T3 T4=$T4 TOTAL=$TOTAL"

# Video segments with Ken Burns
ffmpeg -y -loop 1 -i "$IMG/01-hook-box.png" -vf "scale=1200:1800,zoompan=z='1+0.0015*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE1 * 30" | bc | cut -d. -f1):s=1080x1920:fps=30,format=yuv420p" -t $SCENE1 -c:v libx264 -pix_fmt yuv420p "$OUT/seg1.mp4" 2>/dev/null
ffmpeg -y -loop 1 -i "$IMG/02-pills-reveal.png" -vf "scale=1200:1800,zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE2 * 30" | bc | cut -d. -f1):s=1080x1920:fps=30,format=yuv420p" -t $SCENE2 -c:v libx264 -pix_fmt yuv420p "$OUT/seg2.mp4" 2>/dev/null
ffmpeg -y -loop 1 -i "$IMG/03-price-split.png" -vf "scale=1200:1800,zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE3 * 30" | bc | cut -d. -f1):s=1080x1920:fps=30,format=yuv420p" -t $SCENE3 -c:v libx264 -pix_fmt yuv420p "$OUT/seg3.mp4" 2>/dev/null
ffmpeg -y -loop 1 -i "$IMG/04-cta-phone.png" -vf "scale=1200:1800,zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE4 * 30" | bc | cut -d. -f1):s=1080x1920:fps=30,format=yuv420p" -t $SCENE4 -c:v libx264 -pix_fmt yuv420p "$OUT/seg4.mp4" 2>/dev/null

# Concat video
cat > "$OUT/segments.txt" << EOF
file 'seg1.mp4'
file 'seg2.mp4'
file 'seg3.mp4'
file 'seg4.mp4'
EOF
ffmpeg -y -f concat -safe 0 -i "$OUT/segments.txt" -c copy "$OUT/video_raw.mp4" 2>/dev/null

# Concat audio with gaps
ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 0.4 -c:a aac "$OUT/silence.m4a" 2>/dev/null
ffmpeg -y -i "$AUD/01-hook.mp3" -i "$OUT/silence.m4a" -i "$AUD/02-ingredients.mp3" -i "$OUT/silence.m4a" -i "$AUD/03-math.mp3" -i "$OUT/silence.m4a" -i "$AUD/04-cta.mp3" -i "$OUT/silence.m4a" \
  -filter_complex "[0:a][1:a][2:a][3:a][4:a][5:a][6:a][7:a]concat=n=8:v=0:a=1[outa]" -map "[outa]" -c:a aac -b:a 192k "$OUT/audio_full.m4a" 2>/dev/null

# Final assembly with overlays
SHORTNAME=$(basename "$BASE")
ffmpeg -y -i "$OUT/video_raw.mp4" -i "$OUT/audio_full.m4a" \
  -filter_complex_script "$OVERLAY" \
  -map "[outv]" -map 1:a \
  -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k \
  -shortest \
  "$OUT/${SHORTNAME}-final.mp4" 2>/dev/null

# Report
DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$OUT/${SHORTNAME}-final.mp4")
SIZE=$(ls -lh "$OUT/${SHORTNAME}-final.mp4" | awk '{print $5}')
echo "DONE: $OUT/${SHORTNAME}-final.mp4 — ${DUR}s, ${SIZE}"

# Cleanup
rm -f "$OUT/seg"*.mp4 "$OUT/video_raw.mp4" "$OUT/audio_full.m4a" "$OUT/silence.m4a" "$OUT/segments.txt"
