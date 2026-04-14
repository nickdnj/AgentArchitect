#!/bin/bash
# Assembly script for Cold Plan Short S4-3: "Why Cold Medicine Is the Biggest Markup in Your Drugstore"
# Output: 1080x1920 (9:16 vertical), ~38 seconds

set -e

BASE="/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/cold-plan-video/shorts/s4-3-biggest-markup"
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
DUR2=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/02-breakdown.mp3")
DUR3=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/03-kicker.mp3")
DUR4=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/04-cta.mp3")

# Add padding (0.8s per scene, +0.5s extra on CTA)
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

# Step 1: Create video segments — images are 1024x1536 (portrait, 2:3)
# Pre-crop to 9:16 (1080x1920) then zoompan in that resolution

# Scene 1: Hook - faster zoom (hook energy)
ffmpeg -y -loop 1 -i "$IMG/01-hook.png" \
  -vf "scale=1200:1800,zoompan=z='1+0.0015*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE1 * 30" | bc | cut -d. -f1):s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE1" -c:v libx264 -pix_fmt yuv420p "$OUT/seg1.mp4"

# Scene 2: Breakdown (slow zoom)
ffmpeg -y -loop 1 -i "$IMG/02-breakdown.png" \
  -vf "scale=1200:1800,zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE2 * 30" | bc | cut -d. -f1):s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE2" -c:v libx264 -pix_fmt yuv420p "$OUT/seg2.mp4"

# Scene 3: Kicker (slow zoom)
ffmpeg -y -loop 1 -i "$IMG/03-kicker.png" \
  -vf "scale=1200:1800,zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE3 * 30" | bc | cut -d. -f1):s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE3" -c:v libx264 -pix_fmt yuv420p "$OUT/seg3.mp4"

# Scene 4: CTA phone (slow zoom)
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

# Step 3: Build continuous audio track with 0.4s silence gaps between scenes
ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 0.4 -c:a aac "$OUT/silence.m4a"

ffmpeg -y \
  -i "$AUD/01-hook.mp3" \
  -i "$OUT/silence.m4a" \
  -i "$AUD/02-breakdown.mp3" \
  -i "$OUT/silence.m4a" \
  -i "$AUD/03-kicker.mp3" \
  -i "$OUT/silence.m4a" \
  -i "$AUD/04-cta.mp3" \
  -i "$OUT/silence.m4a" \
  -filter_complex "[0:a][1:a][2:a][3:a][4:a][5:a][6:a][7:a]concat=n=8:v=0:a=1[outa]" \
  -map "[outa]" -c:a aac -b:a 192k "$OUT/audio_full.m4a"

echo "Audio concatenated"

# Step 4: Apply text overlays via filter_complex_script then mux audio
ffmpeg -y -i "$OUT/video_raw.mp4" -i "$OUT/audio_full.m4a" \
  -filter_complex_script "$BASE/overlay.txt" \
  -map "[outv]" -map 1:a \
  -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k \
  -shortest \
  "$OUT/s4-3-biggest-markup-final.mp4"

echo "DONE: $OUT/s4-3-biggest-markup-final.mp4"

# Cleanup temp files
rm -f "$OUT/seg1.mp4" "$OUT/seg2.mp4" "$OUT/seg3.mp4" "$OUT/seg4.mp4"
rm -f "$OUT/video_raw.mp4" "$OUT/audio_full.m4a" "$OUT/silence.m4a" "$OUT/segments.txt"
