#!/bin/bash
# Assembly script for Cold Plan Short S1-1: "What's REALLY in NyQuil?"
# Output: 1080x1920 (9:16 vertical), ~35 seconds

set -e

BASE="/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/cold-plan-video/shorts/s1-1-nyquil"
IMG="$BASE/images"
AUD="$BASE/audio"
OUT="$BASE/output"
mkdir -p "$OUT"

FONT="/System/Library/Fonts/Supplemental/Futura.ttc"
W=1080
H=1920

# Get audio durations
DUR1=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/01-hook.mp3")
DUR2=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/02-ingredients.mp3")
DUR3=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/03-math.mp3")
DUR4=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$AUD/04-cta.mp3")

# Add padding (0.5s before, 0.5s after each scene)
PAD=0.8
SCENE1=$(echo "$DUR1 + $PAD" | bc)
SCENE2=$(echo "$DUR2 + $PAD" | bc)
SCENE3=$(echo "$DUR3 + $PAD" | bc)
SCENE4=$(echo "$DUR4 + $PAD + 0.5" | bc)  # extra hold on CTA

echo "Scene durations: $SCENE1 $SCENE2 $SCENE3 $SCENE4"

# Calculate scene start times
T1=0
T2=$(echo "$T1 + $SCENE1" | bc)
T3=$(echo "$T2 + $SCENE2" | bc)
T4=$(echo "$T3 + $SCENE3" | bc)
TOTAL=$(echo "$T4 + $SCENE4" | bc)

echo "Timeline: T1=$T1 T2=$T2 T3=$T3 T4=$T4 TOTAL=$TOTAL"

# Step 1: Create video segments from each image with gentle zoom
# Each image gets a slow zoom-in (Ken Burns lite)

# Scene 1: Hook - green box (slow zoom in)
ffmpeg -y -loop 1 -i "$IMG/01-hook-box.png" \
  -vf "scale=1200:1800,zoompan=z='1+0.0015*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE1 * 30" | bc | cut -d. -f1):s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE1" -c:v libx264 -pix_fmt yuv420p "$OUT/seg1.mp4"

# Scene 2: Pills reveal (slow zoom in)
ffmpeg -y -loop 1 -i "$IMG/02-pills-reveal.png" \
  -vf "scale=1200:1800,zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE2 * 30" | bc | cut -d. -f1):s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE2" -c:v libx264 -pix_fmt yuv420p "$OUT/seg2.mp4"

# Scene 3: Price split (slow zoom in)
ffmpeg -y -loop 1 -i "$IMG/03-price-split.png" \
  -vf "scale=1200:1800,zoompan=z='1+0.001*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(echo "$SCENE3 * 30" | bc | cut -d. -f1):s=${W}x${H}:fps=30,format=yuv420p" \
  -t "$SCENE3" -c:v libx264 -pix_fmt yuv420p "$OUT/seg3.mp4"

# Scene 4: CTA phone (slow zoom in)
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

# Step 3: Concatenate audio with gaps
# Create silence padding
ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 0.4 -c:a aac "$OUT/silence.m4a"

ffmpeg -y \
  -i "$AUD/01-hook.mp3" \
  -i "$OUT/silence.m4a" \
  -i "$AUD/02-ingredients.mp3" \
  -i "$OUT/silence.m4a" \
  -i "$AUD/03-math.mp3" \
  -i "$OUT/silence.m4a" \
  -i "$AUD/04-cta.mp3" \
  -i "$OUT/silence.m4a" \
  -filter_complex "[0:a][1:a][2:a][3:a][4:a][5:a][6:a][7:a]concat=n=8:v=0:a=1[outa]" \
  -map "[outa]" -c:a aac -b:a 192k "$OUT/audio_full.m4a"

echo "Audio concatenated"

# Step 4: Combine video + audio with TikTok-style text overlays
# Text overlay timing based on scene starts
# TikTok style: bold white text, black outline, center-positioned
# Pop-in effect via fade: alpha goes 0->1 quickly

ffmpeg -y -i "$OUT/video_raw.mp4" -i "$OUT/audio_full.m4a" \
  -filter_complex "
    [0:v]
    drawtext=fontfile='$FONT':text='What\\'s REALLY in':fontsize=72:fontcolor=white:borderw=4:bordercolor=black:x=(w-tw)/2:y=h*0.15:enable='between(t,$T1,$T1+$SCENE1)':alpha='if(lt(t-$T1,0.3),(t-$T1)/0.3,1)',
    drawtext=fontfile='$FONT':text='NyQuil?':fontsize=96:fontcolor=white:borderw=5:bordercolor=black:x=(w-tw)/2:y=h*0.15+90:enable='between(t,$T1,$T1+$SCENE1)':alpha='if(lt(t-$T1,0.3),(t-$T1)/0.3,1)',

    drawtext=fontfile='$FONT':text='Acetaminophen':fontsize=52:fontcolor=white:borderw=3:bordercolor=black:x=(w-tw)/2:y=h*0.12:enable='between(t,$T2+0.3,$T2+$SCENE2)':alpha='if(lt(t-$T2-0.3,0.2),(t-$T2-0.3)/0.2,1)',
    drawtext=fontfile='$FONT':text='pain & fever':fontsize=40:fontcolor=0xFFD700:borderw=3:bordercolor=black:x=(w-tw)/2:y=h*0.12+60:enable='between(t,$T2+0.3,$T2+$SCENE2)':alpha='if(lt(t-$T2-0.3,0.2),(t-$T2-0.3)/0.2,1)',

    drawtext=fontfile='$FONT':text='Dextromethorphan':fontsize=52:fontcolor=white:borderw=3:bordercolor=black:x=(w-tw)/2:y=h*0.12+130:enable='between(t,$T2+2.5,$T2+$SCENE2)':alpha='if(lt(t-$T2-2.5,0.2),(t-$T2-2.5)/0.2,1)',
    drawtext=fontfile='$FONT':text='cough':fontsize=40:fontcolor=0xFFD700:borderw=3:bordercolor=black:x=(w-tw)/2:y=h*0.12+190:enable='between(t,$T2+2.5,$T2+$SCENE2)':alpha='if(lt(t-$T2-2.5,0.2),(t-$T2-2.5)/0.2,1)',

    drawtext=fontfile='$FONT':text='Diphenhydramine':fontsize=52:fontcolor=white:borderw=3:bordercolor=black:x=(w-tw)/2:y=h*0.12+260:enable='between(t,$T2+5.0,$T2+$SCENE2)':alpha='if(lt(t-$T2-5.0,0.2),(t-$T2-5.0)/0.2,1)',
    drawtext=fontfile='$FONT':text='sleep':fontsize=40:fontcolor=0xFFD700:borderw=3:bordercolor=black:x=(w-tw)/2:y=h*0.12+320:enable='between(t,$T2+5.0,$T2+$SCENE2)':alpha='if(lt(t-$T2-5.0,0.2),(t-$T2-5.0)/0.2,1)',

    drawtext=fontfile='$FONT':text='\$12-15':fontsize=80:fontcolor=0xFF4444:borderw=4:bordercolor=black:x=w*0.12:y=h*0.08:enable='between(t,$T3,$T3+$SCENE3)':alpha='if(lt(t-$T3,0.3),(t-$T3)/0.3,1)',
    drawtext=fontfile='$FONT':text='→ 12¢':fontsize=80:fontcolor=0x44FF44:borderw=4:bordercolor=black:x=w*0.58:y=h*0.08:enable='between(t,$T3+1.5,$T3+$SCENE3)':alpha='if(lt(t-$T3-1.5,0.3),(t-$T3-1.5)/0.3,1)',

    drawtext=fontfile='$FONT':text='coldplan.app':fontsize=72:fontcolor=white:borderw=4:bordercolor=black:x=(w-tw)/2:y=h*0.82:enable='between(t,$T4,$T4+$SCENE4)':alpha='if(lt(t-$T4,0.3),(t-$T4)/0.3,1)',
    drawtext=fontfile='$FONT':text='Every recipe. Every price.':fontsize=44:fontcolor=0xAADDFF:borderw=3:bordercolor=black:x=(w-tw)/2:y=h*0.82+80:enable='between(t,$T4+1.0,$T4+$SCENE4)':alpha='if(lt(t-$T4-1.0,0.3),(t-$T4-1.0)/0.3,1)'
    [outv]
  " \
  -map "[outv]" -map 1:a \
  -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k \
  -shortest \
  "$OUT/s1-1-nyquil-final.mp4"

echo "DONE: $OUT/s1-1-nyquil-final.mp4"

# Cleanup temp files
rm -f "$OUT/seg1.mp4" "$OUT/seg2.mp4" "$OUT/seg3.mp4" "$OUT/seg4.mp4"
rm -f "$OUT/video_raw.mp4" "$OUT/audio_full.m4a" "$OUT/silence.m4a" "$OUT/segments.txt"
