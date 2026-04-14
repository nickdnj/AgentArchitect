#!/bin/bash
# Assembly script for Cold Plan Short S2-2: "Can't Sleep, Stuffy Nose"
# Output: 1080x1920 (9:16 vertical), ~34 seconds

set -e

BASE="/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/cold-plan-video/shorts/s2-2-cant-sleep"
IMG="$BASE/images"
AUD="$BASE/audio"
OUT="$BASE/output"
mkdir -p "$OUT"

FONT="/System/Library/Fonts/Supplemental/Futura.ttc"
W=1080
H=1920

# Get audio durations
DUR1=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/01-hook.mp3")
DUR2=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/02-fix.mp3")
DUR3=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/03-cost.mp3")
DUR4=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/04-cta.mp3")

# Add padding (0.8s after each scene)
PAD=0.8
SCENE1=$(echo "$DUR1 + $PAD" | bc)
SCENE2=$(echo "$DUR2 + $PAD" | bc)
SCENE3=$(echo "$DUR3 + $PAD" | bc)
SCENE4=$(echo "$DUR4 + $PAD + 0.5" | bc)  # extra hold on CTA

echo "Audio durations: $DUR1 $DUR2 $DUR3 $DUR4"
echo "Scene durations: $SCENE1 $SCENE2 $SCENE3 $SCENE4"

# Calculate scene start times (in video timeline)
T1=0
T2=$(echo "$T1 + $SCENE1" | bc)
T3=$(echo "$T2 + $SCENE2" | bc)
T4=$(echo "$T3 + $SCENE3" | bc)
TOTAL=$(echo "$T4 + $SCENE4" | bc)

echo "Timeline: T1=$T1 T2=$T2 T3=$T3 T4=$T4 TOTAL=$TOTAL"

# Step 1: Create video segments — pre-cropped 9:16 (scale height to 1920, center-crop to 1080 wide)
# All source images are 1024x1536 (portrait) — scale to fit 1920 height, then crop to 1080 width

# Scene 1: Hook - fast zoom (hook grabs attention)
ffmpeg -y -loop 1 -i "$IMG/01-hook.png" \
  -vf "scale=1280:1920,zoompan=z='1+0.0015*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE1 * 30" | bc | cut -d. -f1):s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE1" -c:v libx264 -pix_fmt yuv420p "$OUT/seg1.mp4"

# Scene 2: Pills fix (gentle zoom)
ffmpeg -y -loop 1 -i "$IMG/02-pills-fix.png" \
  -vf "scale=1280:1920,zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE2 * 30" | bc | cut -d. -f1):s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE2" -c:v libx264 -pix_fmt yuv420p "$OUT/seg2.mp4"

# Scene 3: Price compare (gentle zoom)
ffmpeg -y -loop 1 -i "$IMG/03-price-compare.png" \
  -vf "scale=1280:1920,zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE3 * 30" | bc | cut -d. -f1):s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE3" -c:v libx264 -pix_fmt yuv420p "$OUT/seg3.mp4"

# Scene 4: CTA phone (gentle zoom)
ffmpeg -y -loop 1 -i "$IMG/04-cta-phone.png" \
  -vf "scale=1280:1920,zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE4 * 30" | bc | cut -d. -f1):s=${W}x${H}:fps=30,format=yuv420p" \
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

# Step 3: Concatenate audio with 0.4s silence gaps between scenes
ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 0.4 -c:a aac "$OUT/silence.m4a"

ffmpeg -y \
  -i "$AUD/01-hook.mp3" \
  -i "$OUT/silence.m4a" \
  -i "$AUD/02-fix.mp3" \
  -i "$OUT/silence.m4a" \
  -i "$AUD/03-cost.mp3" \
  -i "$OUT/silence.m4a" \
  -i "$AUD/04-cta.mp3" \
  -i "$OUT/silence.m4a" \
  -filter_complex "[0:a][1:a][2:a][3:a][4:a][5:a][6:a][7:a]concat=n=8:v=0:a=1[outa]" \
  -map "[outa]" -c:a aac -b:a 192k "$OUT/audio_full.m4a"

echo "Audio concatenated"

# Step 4: Apply text overlays using filter_complex_script
# Build overlay.txt with exact scene timings substituted
# The overlay file uses T1/T2/T3/T4 variables — substitute them here

OVERLAY_TMP="$OUT/overlay_rendered.txt"

# Write the overlay file with actual computed timestamps
cat > "$OVERLAY_TMP" << OVERLAYEOF
[0:v]

drawtext=fontfile=/System/Library/Fonts/Supplemental/Futura.ttc:text='Benadryl':fontsize=60:fontcolor=white:borderw=3:bordercolor=black:x=(w-tw)/2:y=h*0.10:enable='between(t,$(echo "$T2 + 0.3" | bc),$(echo "$T2 + $SCENE2" | bc))':alpha='if(lt(t-$(echo "$T2 + 0.3" | bc),0.2),(t-$(echo "$T2 + 0.3" | bc))/0.2,1)',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Futura.ttc:text='sleep':fontsize=40:fontcolor=0xFFD700:borderw=3:bordercolor=black:x=(w-tw)/2:y=h*0.10+70:enable='between(t,$(echo "$T2 + 0.3" | bc),$(echo "$T2 + $SCENE2" | bc))':alpha='if(lt(t-$(echo "$T2 + 0.3" | bc),0.2),(t-$(echo "$T2 + 0.3" | bc))/0.2,1)',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Futura.ttc:text='Sudafed PE':fontsize=60:fontcolor=white:borderw=3:bordercolor=black:x=(w-tw)/2:y=h*0.10+145:enable='between(t,$(echo "$T2 + 2.5" | bc),$(echo "$T2 + $SCENE2" | bc))':alpha='if(lt(t-$(echo "$T2 + 2.5" | bc),0.2),(t-$(echo "$T2 + 2.5" | bc))/0.2,1)',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Futura.ttc:text='congestion':fontsize=40:fontcolor=0xFFD700:borderw=3:bordercolor=black:x=(w-tw)/2:y=h*0.10+215:enable='between(t,$(echo "$T2 + 2.5" | bc),$(echo "$T2 + $SCENE2" | bc))':alpha='if(lt(t-$(echo "$T2 + 2.5" | bc),0.2),(t-$(echo "$T2 + 2.5" | bc))/0.2,1)',

drawtext=fontfile=/System/Library/Fonts/Supplemental/Futura.ttc:text='\$15':fontsize=80:fontcolor=0xFF4444:borderw=4:bordercolor=black:x=w*0.10:y=h*0.08:enable='between(t,$T3,$(echo "$T3 + $SCENE3" | bc))':alpha='if(lt(t-$T3,0.3),(t-$T3)/0.3,1)',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Futura.ttc:text='20 cents':fontsize=80:fontcolor=0x44FF44:borderw=4:bordercolor=black:x=w*0.58:y=h*0.08:enable='between(t,$(echo "$T3 + 1.5" | bc),$(echo "$T3 + $SCENE3" | bc))':alpha='if(lt(t-$(echo "$T3 + 1.5" | bc),0.3),(t-$(echo "$T3 + 1.5" | bc))/0.3,1)',

drawtext=fontfile=/System/Library/Fonts/Supplemental/Futura.ttc:text='cold-plan-app.web.app':fontsize=56:fontcolor=white:borderw=4:bordercolor=black:x=(w-tw)/2:y=h*0.78:enable='between(t,$T4,$(echo "$T4 + $SCENE4" | bc))':alpha='if(lt(t-$T4,0.3),(t-$T4)/0.3,1)',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Futura.ttc:text='Every recipe. Every price.':fontsize=44:fontcolor=0xAADDFF:borderw=3:bordercolor=black:x=(w-tw)/2:y=h*0.78+66:enable='between(t,$(echo "$T4 + 1.0" | bc),$(echo "$T4 + $SCENE4" | bc))':alpha='if(lt(t-$(echo "$T4 + 1.0" | bc),0.3),(t-$(echo "$T4 + 1.0" | bc))/0.3,1)',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Futura.ttc:text='Free. No login. No ads. No data collected.':fontsize=34:fontcolor=0xCCCCCC:borderw=3:bordercolor=black:x=(w-tw)/2:y=h*0.78+126:enable='between(t,$(echo "$T4 + 2.0" | bc),$(echo "$T4 + $SCENE4" | bc))':alpha='if(lt(t-$(echo "$T4 + 2.0" | bc),0.3),(t-$(echo "$T4 + 2.0" | bc))/0.3,1)',

drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text="It's 2 AM.":fontsize=88:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,0.0,1.2)',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text="You can't breathe.":fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,1.2,2.8)',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='And you'"'"'ve got':fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,2.8,4.0)',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='that big meeting.':fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,4.0,$(echo "$T1 + $SCENE1" | bc))',

drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='Two pills.':fontsize=88:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T2 + 0.4" | bc),$(echo "$T2 + 1.2" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='Benadryl':fontsize=88:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T2 + 1.2" | bc),$(echo "$T2 + 2.0" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='knocks you out.':fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T2 + 2.0" | bc),$(echo "$T2 + 3.2" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='Sudafed PE':fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T2 + 3.2" | bc),$(echo "$T2 + 4.1" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='opens you up.':fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T2 + 4.1" | bc),$(echo "$T2 + 5.1" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='Same combo':fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T2 + 5.1" | bc),$(echo "$T2 + 6.0" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='you'"'"'d get in NyQuil':fontsize=78:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T2 + 6.0" | bc),$(echo "$T2 + 7.5" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='minus the stuff':fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T2 + 7.5" | bc),$(echo "$T2 + 8.7" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='you don'"'"'t need.':fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T2 + 8.7" | bc),$(echo "$T2 + 10.0" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='Breathing and sleeping':fontsize=74:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T2 + 10.0" | bc),$(echo "$T2 + 11.4" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='in twenty minutes.':fontsize=78:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T2 + 11.4" | bc),$(echo "$T2 + $SCENE2" | bc))',

drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='A box of NyQuil':fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T3 + 0.4" | bc),$(echo "$T3 + 1.8" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='plus Sudafed PE?':fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T3 + 1.8" | bc),$(echo "$T3 + 3.0" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='Fifteen bucks.':fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T3 + 3.0" | bc),$(echo "$T3 + 4.0" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='The same two':fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T3 + 4.0" | bc),$(echo "$T3 + 4.8" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='generics?':fontsize=88:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T3 + 4.8" | bc),$(echo "$T3 + 5.5" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='Twenty cents.':fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.46:enable='between(t,$(echo "$T3 + 5.5" | bc),$(echo "$T3 + $SCENE3" | bc))',

drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='Cold Plan breaks down':fontsize=78:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.30:enable='between(t,$(echo "$T4 + 0.4" | bc),$(echo "$T4 + 2.0" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='every brand-name':fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.30:enable='between(t,$(echo "$T4 + 2.0" | bc),$(echo "$T4 + 3.5" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='cold medicine':fontsize=82:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.30:enable='between(t,$(echo "$T4 + 3.5" | bc),$(echo "$T4 + 4.8" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='into its generic recipe.':fontsize=74:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.30:enable='between(t,$(echo "$T4 + 4.8" | bc),$(echo "$T4 + 6.3" | bc))',
drawtext=fontfile=/System/Library/Fonts/Supplemental/Impact.ttf:text='Link in bio.':fontsize=88:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=h*0.30:enable='between(t,$(echo "$T4 + 6.3" | bc),$(echo "$T4 + $SCENE4" | bc))'

[outv]
OVERLAYEOF

echo "Overlay file written to $OVERLAY_TMP"

# Step 5: Composite video + audio + text overlays
ffmpeg -y -i "$OUT/video_raw.mp4" -i "$OUT/audio_full.m4a" \
  -filter_complex_script "$OVERLAY_TMP" \
  -map "[outv]" -map 1:a \
  -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k \
  -shortest \
  "$OUT/s2-2-cant-sleep-final.mp4"

echo "DONE: $OUT/s2-2-cant-sleep-final.mp4"

# Cleanup temp files
rm -f "$OUT/seg1.mp4" "$OUT/seg2.mp4" "$OUT/seg3.mp4" "$OUT/seg4.mp4"
rm -f "$OUT/video_raw.mp4" "$OUT/audio_full.m4a" "$OUT/silence.m4a" "$OUT/segments.txt"
rm -f "$OUT/overlay_rendered.txt"

echo "Temp files cleaned up."
