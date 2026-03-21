#!/usr/bin/env python3
"""Convert SRT to word-by-word progressive reveal ASS subtitles.
Words start gray, turn white when spoken, and STAY white."""
import re, sys

def parse_srt(path):
    with open(path) as f:
        content = f.read()
    blocks = re.split(r'\n\n+', content.strip())
    segments = []
    for block in blocks:
        lines = block.strip().split('\n')
        if len(lines) < 3: continue
        m = re.match(r'(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})', lines[1])
        if not m: continue
        g = [int(x) for x in m.groups()]
        start = g[0]*3600 + g[1]*60 + g[2] + g[3]/1000
        end = g[4]*3600 + g[5]*60 + g[6] + g[7]/1000
        text = ' '.join(lines[2:]).strip()
        segments.append((start, end, text))
    return segments

def to_ass_time(s):
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = int(s % 60)
    cs = int((s % 1) * 100)
    return f"{h}:{m:02d}:{sec:02d}.{cs:02d}"

# ASS colors are in &HBBGGRR& format
GRAY = r"{\c&H888888&}"
WHITE = r"{\c&HFFFFFF&}"

def generate_pop_ass(segments, font_size=52):
    header = f"""[Script Info]
Title: Pop Subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Pop,Arial,{font_size},&H00888888,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,0,5,60,60,480

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    for start, end, text in segments:
        words = text.split()
        if not words: continue
        duration = end - start
        word_dur = duration / len(words)

        for i in range(len(words)):
            w_start = start + i * word_dur
            w_end = start + (i + 1) * word_dur

            # Build line: already-spoken words white, current word white, upcoming words gray
            parts = []
            # Words already spoken (0..i-1) — white
            if i > 0:
                parts.append(WHITE + ' '.join(words[:i]))
            # Current word — white (bold for emphasis)
            parts.append(WHITE + words[i])
            # Words not yet spoken (i+1..end) — gray
            if i < len(words) - 1:
                parts.append(GRAY + ' '.join(words[i+1:]))

            line = ' '.join(parts)
            events.append(f"Dialogue: 0,{to_ass_time(w_start)},{to_ass_time(w_end)},Pop,,0,0,0,,{line}")

        # After all words spoken, show full line in white until segment ends
        all_spoken_start = start + len(words) * word_dur
        if all_spoken_start < end:
            line = WHITE + ' '.join(words)
            events.append(f"Dialogue: 0,{to_ass_time(all_spoken_start)},{to_ass_time(end)},Pop,,0,0,0,,{line}")

    return header + '\n'.join(events) + '\n'

if __name__ == '__main__':
    srt_path = sys.argv[1]
    ass_path = sys.argv[2]
    font_size = int(sys.argv[3]) if len(sys.argv) > 3 else 52
    segments = parse_srt(srt_path)
    ass_content = generate_pop_ass(segments, font_size)
    with open(ass_path, 'w') as f:
        f.write(ass_content)
    print(f"Generated {ass_path}")
