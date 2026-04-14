#!/bin/bash
# Assembly script for Cold Plan Short S5-4: "The $20 Medicine Cabinet"
# Output: 1080x1920 (9:16 vertical), ~50 seconds

set -e

BASE="/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/cold-plan-video/shorts/s5-4-twenty-dollar-cabinet"
IMG="$BASE/images"
AUD="$BASE/audio"
OUT="$BASE/output"
mkdir -p "$OUT"

IMPACT="/System/Library/Fonts/Supplemental/Impact.ttf"
FUTURA="/System/Library/Fonts/Supplemental/Futura.ttc"
W=1080
H=1920

# Get audio durations
DUR1=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/01-hook.mp3")
DUR2=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/02-build.mp3")
DUR3=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/03-comparison.mp3")
DUR4=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/04-cta.mp3")

# Add padding (0.8s per scene, +0.5s extra hold on CTA)
PAD=0.8
SCENE1=$(echo "$DUR1 + $PAD" | bc)
SCENE2=$(echo "$DUR2 + $PAD" | bc)
SCENE3=$(echo "$DUR3 + $PAD" | bc)
SCENE4=$(echo "$DUR4 + $PAD + 0.5" | bc)

echo "Scene durations: $SCENE1 $SCENE2 $SCENE3 $SCENE4"

# Calculate scene start times
T1=0
T2=$(echo "$T1 + $SCENE1" | bc)
T3=$(echo "$T2 + $SCENE2" | bc)
T4=$(echo "$T3 + $SCENE3" | bc)
TOTAL=$(echo "$T4 + $SCENE4" | bc)

echo "Timeline: T1=$T1 T2=$T2 T3=$T3 T4=$T4 TOTAL=$TOTAL"

# All images are 1024x1536 portrait — pre-crop to 9:16 then zoompan
# 9:16 crop of a 1024-wide image: target height = 1024 * 16/9 = 1820, but image is only 1536 tall
# So crop to full width at max 9:16 that fits: 1024x1820 won't fit. Use 864x1536 (864 = 1536*9/16)
# Crop 864 wide centered: x=(1024-864)/2=80
# Then scale to 1080x1920 then zoompan headroom: scale up to 1200x(1200*1920/1080)=1200x2133

CROP="crop=864:1536:80:0,scale=1200:2133"

SCENE1_FRAMES=$(echo "$SCENE1 * 30" | bc | cut -d. -f1)
SCENE2_FRAMES=$(echo "$SCENE2 * 30" | bc | cut -d. -f1)
SCENE3_FRAMES=$(echo "$SCENE3 * 30" | bc | cut -d. -f1)
SCENE4_FRAMES=$(echo "$SCENE4 * 30" | bc | cut -d. -f1)

echo "Generating video segments..."

# Scene 1: Hook — faster zoom (z='1+0.0015*in')
ffmpeg -y -loop 1 -i "$IMG/01-hook.png" \
  -vf "${CROP},zoompan=z='1+0.0015*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${SCENE1_FRAMES}:s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE1" -c:v libx264 -pix_fmt yuv420p "$OUT/seg1.mp4"

# Scene 2: Build — gentle zoom (z='1+0.001*in')
ffmpeg -y -loop 1 -i "$IMG/02-build.png" \
  -vf "${CROP},zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${SCENE2_FRAMES}:s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE2" -c:v libx264 -pix_fmt yuv420p "$OUT/seg2.mp4"

# Scene 3: Comparison — gentle zoom
ffmpeg -y -loop 1 -i "$IMG/03-comparison.png" \
  -vf "${CROP},zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${SCENE3_FRAMES}:s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE3" -c:v libx264 -pix_fmt yuv420p "$OUT/seg3.mp4"

# Scene 4: CTA — gentle zoom
ffmpeg -y -loop 1 -i "$IMG/04-cta-phone.png" \
  -vf "${CROP},zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${SCENE4_FRAMES}:s=${W}x${H}:fps=30,format=yuv420p" \
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
echo "Video concatenated: $OUT/video_raw.mp4"

# Step 3: Concatenate audio with 0.4s silence gaps between scenes
ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 0.4 -c:a aac "$OUT/silence.m4a"

ffmpeg -y \
  -i "$AUD/01-hook.mp3" \
  -i "$OUT/silence.m4a" \
  -i "$AUD/02-build.mp3" \
  -i "$OUT/silence.m4a" \
  -i "$AUD/03-comparison.mp3" \
  -i "$OUT/silence.m4a" \
  -i "$AUD/04-cta.mp3" \
  -i "$OUT/silence.m4a" \
  -filter_complex "[0:a][1:a][2:a][3:a][4:a][5:a][6:a][7:a]concat=n=8:v=0:a=1[outa]" \
  -map "[outa]" -c:a aac -b:a 192k "$OUT/audio_full.m4a"

echo "Audio concatenated"

# Step 4: Apply text overlays using filter_complex_script
# Overlay timings in overlay.txt use hardcoded values computed from the actual durations:
#   T2=5.35, T3=29.84, T4=42.85
# These are baked into overlay.txt at script-write time and match the actual audio durations.

ffmpeg -y -i "$OUT/video_raw.mp4" -i "$OUT/audio_full.m4a" \
  -filter_complex_script "$BASE/overlay.txt" \
  -map "[outv]" -map 1:a \
  -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k \
  -shortest \
  "$OUT/s5-4-twenty-dollar-cabinet-final.mp4"

echo "DONE: $OUT/s5-4-twenty-dollar-cabinet-final.mp4"

# Verify audio levels
echo "Audio level check:"
ffmpeg -i "$OUT/s5-4-twenty-dollar-cabinet-final.mp4" -af "volumedetect" -f null /dev/null 2>&1 | grep -E "mean_volume|max_volume"

# Cleanup temp files
rm -f "$OUT/seg1.mp4" "$OUT/seg2.mp4" "$OUT/seg3.mp4" "$OUT/seg4.mp4"
rm -f "$OUT/video_raw.mp4" "$OUT/audio_full.m4a" "$OUT/silence.m4a" "$OUT/segments.txt"
echo "Temp files cleaned up"
