#!/bin/bash
# Assembly script for Cold Plan Short S4-2: "The $0.47 NyQuil Recipe"
# Output: 1080x1920 (9:16 vertical), ~41 seconds

set -e

BASE="/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/cold-plan-video/shorts/s4-2-nyquil-recipe"
IMG="$BASE/images"
AUD="$BASE/audio"
OUT="$BASE/output"
OVERLAY="$BASE/overlay.txt"
mkdir -p "$OUT"

IMPACT="/System/Library/Fonts/Supplemental/Impact.ttf"
FUTURA="/System/Library/Fonts/Supplemental/Futura.ttc"
W=1080
H=1920

# Audio durations (pre-measured)
DUR1=2.879274
DUR2=18.018685
DUR3=8.637823
DUR4=6.733787

# Padding: 0.8s per scene, +0.5s extra on CTA, 0.4s audio gaps
PAD=0.8
EXTRA_CTA=0.5
AUDIO_GAP=0.4

SCENE1=$(echo "$DUR1 + $PAD" | bc)
SCENE2=$(echo "$DUR2 + $PAD" | bc)
SCENE3=$(echo "$DUR3 + $PAD" | bc)
SCENE4=$(echo "$DUR4 + $PAD + $EXTRA_CTA" | bc)

echo "Scene durations: $SCENE1  $SCENE2  $SCENE3  $SCENE4"

# Scene start times (accounting for 0.4s audio gaps between scenes)
T1=0
T2=$(echo "$T1 + $SCENE1 + $AUDIO_GAP" | bc)
T3=$(echo "$T2 + $SCENE2 + $AUDIO_GAP" | bc)
T4=$(echo "$T3 + $SCENE3 + $AUDIO_GAP" | bc)
TOTAL=$(echo "$T4 + $SCENE4" | bc)

echo "Timeline: T1=$T1  T2=$T2  T3=$T3  T4=$T4  TOTAL=$TOTAL"

# Step 1: Create video segments (portrait images pre-cropped to 9:16 via pillarbox zoom)
# Images are already 1024x1536 (portrait) — scale to fill 1080x1920 exactly, then zoompan

# Scene 1: Hook — faster zoom (hook energy)
ffmpeg -y -loop 1 -i "$IMG/01-hook.png" \
  -vf "scale=1200:1800,zoompan=z='1+0.0015*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE1 * 30" | bc | cut -d. -f1):s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE1" -c:v libx264 -pix_fmt yuv420p "$OUT/seg1.mp4"

# Scene 2: Recipe — gentle zoom
ffmpeg -y -loop 1 -i "$IMG/02-recipe.png" \
  -vf "scale=1200:1800,zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE2 * 30" | bc | cut -d. -f1):s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE2" -c:v libx264 -pix_fmt yuv420p "$OUT/seg2.mp4"

# Scene 3: Contrast — gentle zoom
ffmpeg -y -loop 1 -i "$IMG/03-contrast.png" \
  -vf "scale=1200:1800,zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE3 * 30" | bc | cut -d. -f1):s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE3" -c:v libx264 -pix_fmt yuv420p "$OUT/seg3.mp4"

# Scene 4: CTA phone — gentle zoom
ffmpeg -y -loop 1 -i "$IMG/04-cta-phone.png" \
  -vf "scale=1200:1800,zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE4 * 30" | bc | cut -d. -f1):s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE4" -c:v libx264 -pix_fmt yuv420p "$OUT/seg4.mp4"

echo "Video segments created"

# Step 2: Concatenate video segments
cat > "$OUT/segments.txt" << EOF
file 'seg1.mp4'
file 'seg2.mp4'
file 'seg3.mp4'
file 'seg4.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$OUT/segments.txt" -c copy "$OUT/video_raw.mp4"
echo "Video concat done"

# Step 3: Build audio — narration clips with 0.4s silence gaps between scenes
ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 0.4 -c:a aac "$OUT/silence.m4a"

ffmpeg -y \
  -i "$AUD/01-hook.mp3" \
  -i "$OUT/silence.m4a" \
  -i "$AUD/02-recipe.mp3" \
  -i "$OUT/silence.m4a" \
  -i "$AUD/03-contrast.mp3" \
  -i "$OUT/silence.m4a" \
  -i "$AUD/04-cta.mp3" \
  -i "$OUT/silence.m4a" \
  -filter_complex "[0:a][1:a][2:a][3:a][4:a][5:a][6:a][7:a]concat=n=8:v=0:a=1[outa]" \
  -map "[outa]" -c:a aac -b:a 192k "$OUT/audio_full.m4a"

echo "Audio concatenated"

# Step 4: Apply text overlays (via filter_complex_script) and mux audio
ffmpeg -y -i "$OUT/video_raw.mp4" -i "$OUT/audio_full.m4a" \
  -filter_complex_script "$OVERLAY" \
  -map "[outv]" -map 1:a \
  -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k \
  -shortest \
  "$OUT/s4-2-nyquil-recipe-final.mp4"

echo "DONE: $OUT/s4-2-nyquil-recipe-final.mp4"

# Cleanup temp files
rm -f "$OUT/seg1.mp4" "$OUT/seg2.mp4" "$OUT/seg3.mp4" "$OUT/seg4.mp4"
rm -f "$OUT/video_raw.mp4" "$OUT/audio_full.m4a" "$OUT/silence.m4a" "$OUT/segments.txt"
echo "Temp files cleaned up"
