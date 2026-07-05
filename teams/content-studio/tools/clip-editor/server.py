#!/usr/bin/env python3
"""
Clip Editor — lightweight, on-demand web video clip editor for storyboard review.

Python standard library only. Requires ffmpeg/ffprobe on PATH.

Serves a single-page editor (index.html) that lets you visually trim, cut,
crop-to-9:16, or split a scene clip and save the result back into the project
store, regenerating the thumbnail and appending a revision-history line to the
Obsidian storyboard doc.

GENERIC / config-driven: all project-specific paths arrive via URL query params.
Nothing about any specific project is hardcoded.

Endpoints:
  GET  /edit?clip=&thumb=&scene=&doc=   -> serves index.html (params passed through)
  GET  /info?path=                       -> JSON ffprobe info {width,height,duration,fps,...}
  GET  /media?path=                      -> streams a video file with HTTP Range (206) support
  POST /save                             -> runs ffmpeg op(s), writes outputs, returns JSON

Port: 8770
"""

import os
import sys
import json
import shutil
import subprocess
import urllib.parse
import datetime
import re
import http.server
import socketserver

PORT = 8770
HERE = os.path.dirname(os.path.abspath(__file__))
INDEX_HTML = os.path.join(HERE, "index.html")

# Video output spec (vertical 9:16)
OUT_W = 1080
OUT_H = 1920
FPS = 30

# ---------------------------------------------------------------------------
# Path safety
# ---------------------------------------------------------------------------
# We only ever read/write inside these roots. This prevents the /media and
# /save endpoints from being abused to serve or clobber arbitrary files.
ALLOWED_ROOTS = [
    "/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content",
    "/Users/nickd/Workspaces/wiki",
    "/tmp",
    "/var/folders",  # macOS temp dirs
]


def _is_allowed(path):
    """True if the real (resolved) path lives under one of the allowed roots."""
    try:
        real = os.path.realpath(path)
    except Exception:
        return False
    for root in ALLOWED_ROOTS:
        root_real = os.path.realpath(root)
        if real == root_real or real.startswith(root_real + os.sep):
            return True
    return False


# ---------------------------------------------------------------------------
# ffprobe / ffmpeg helpers
# ---------------------------------------------------------------------------
def ffprobe_info(path):
    """Return a dict with width, height, duration, fps for the given video."""
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate",
        "-show_entries", "format=duration",
        "-of", "json", path,
    ]
    out = subprocess.run(cmd, capture_output=True, text=True, check=True).stdout
    data = json.loads(out)
    stream = (data.get("streams") or [{}])[0]
    fmt = data.get("format") or {}
    width = int(stream.get("width") or 0)
    height = int(stream.get("height") or 0)
    duration = float(fmt.get("duration") or 0.0)
    # r_frame_rate is like "30/1"
    fps = 30.0
    rfr = stream.get("r_frame_rate")
    if rfr and "/" in rfr:
        num, den = rfr.split("/")
        den = float(den) or 1.0
        fps = float(num) / den
    return {
        "width": width,
        "height": height,
        "duration": round(duration, 3),
        "fps": round(fps, 3),
    }


def run_ffmpeg(args):
    """Run ffmpeg with -y, raising a descriptive error on failure."""
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"] + args
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError("ffmpeg failed:\n" + proc.stderr.strip())


# Common encode args for clean re-encodes to the 9:16 H.264 + AAC spec.
def _encode_args():
    return [
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-pix_fmt", "yuv420p", "-r", str(FPS),
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
    ]


# ---------------------------------------------------------------------------
# Operations
# ---------------------------------------------------------------------------
def op_trim(src, dst, t_in, t_out):
    """Keep [t_in, t_out]. Re-encode for a clean cut."""
    run_ffmpeg([
        "-i", src,
        "-ss", f"{t_in:.3f}", "-to", f"{t_out:.3f}",
    ] + _encode_args() + [dst])


def op_cut(src, dst, a, b):
    """Remove [a, b] from the middle; concat the surviving parts.

    Uses the filtergraph trim+concat approach so it works with a single
    input and re-encodes cleanly.
    """
    info = ffprobe_info(src)
    dur = info["duration"]
    a = max(0.0, a)
    b = min(dur, b)
    # Build segment list: part before a, part after b (skip empty segments).
    segments = []
    if a > 0.01:
        segments.append((0.0, a))
    if (dur - b) > 0.01:
        segments.append((b, dur))
    if not segments:
        raise RuntimeError("Cut would remove the entire clip.")

    # Build filter_complex with one trimmed v/a pair per segment, then concat.
    vfilters = []
    afilters = []
    concat_inputs = []
    for i, (s, e) in enumerate(segments):
        vfilters.append(
            f"[0:v]trim=start={s:.3f}:end={e:.3f},setpts=PTS-STARTPTS[v{i}]"
        )
        afilters.append(
            f"[0:a]atrim=start={s:.3f}:end={e:.3f},asetpts=PTS-STARTPTS[a{i}]"
        )
        concat_inputs.append(f"[v{i}][a{i}]")
    n = len(segments)
    concat = "".join(concat_inputs) + f"concat=n={n}:v=1:a=1[outv][outa]"
    filtergraph = ";".join(vfilters + afilters + [concat])
    run_ffmpeg([
        "-i", src,
        "-filter_complex", filtergraph,
        "-map", "[outv]", "-map", "[outa]",
    ] + _encode_args() + [dst])


def op_crop(src, dst, x, y, w, h):
    """Crop the rectangle (x,y,w,h) in SOURCE pixels, then scale to 9:16."""
    # Clamp/round to integers and ensure even dims (yuv420p requirement).
    x = max(0, int(round(x)))
    y = max(0, int(round(y)))
    w = max(2, int(round(w)))
    h = max(2, int(round(h)))
    if w % 2:
        w -= 1
    if h % 2:
        h -= 1
    vf = f"crop={w}:{h}:{x}:{y},scale={OUT_W}:{OUT_H}:flags=lanczos"
    run_ffmpeg([
        "-i", src,
        "-vf", vf,
    ] + _encode_args() + [dst])


def op_split(src, dst_paths, points):
    """Split src at the given times into len(points)+1 sibling clips.

    `points` is a sorted list of interior split times (seconds).
    `dst_paths` must have len(points)+1 entries.
    """
    info = ffprobe_info(src)
    dur = info["duration"]
    bounds = [0.0] + sorted(points) + [dur]
    segs = list(zip(bounds[:-1], bounds[1:]))
    if len(segs) != len(dst_paths):
        raise RuntimeError(
            f"split: got {len(segs)} segments but {len(dst_paths)} output paths"
        )
    durations = []
    for (s, e), out in zip(segs, dst_paths):
        run_ffmpeg([
            "-i", src,
            "-ss", f"{s:.3f}", "-to", f"{e:.3f}",
        ] + _encode_args() + [out])
        durations.append(round(e - s, 3))
    return durations


def regen_thumb(clip, thumb):
    """Grab a frame at ~40% of the clip duration as the thumbnail."""
    info = ffprobe_info(clip)
    t = max(0.0, info["duration"] * 0.40)
    os.makedirs(os.path.dirname(thumb), exist_ok=True)
    run_ffmpeg([
        "-ss", f"{t:.3f}", "-i", clip,
        "-frames:v", "1", "-q:v", "3", thumb,
    ])


def backup_original(clip):
    """Copy clip into an `originals/` sibling subfolder once (idempotent)."""
    d = os.path.dirname(clip)
    name = os.path.basename(clip)
    odir = os.path.join(d, "originals")
    os.makedirs(odir, exist_ok=True)
    backup = os.path.join(odir, name)
    if not os.path.exists(backup):
        shutil.copy2(clip, backup)
        return backup
    return None  # already backed up


def append_revision(doc_path, line):
    """Append a bullet to the end of the '## Revision history' list.

    The section header contains the text 'Revision history' (it has an emoji
    prefix in the real doc). We find that header, then insert the new bullet
    after the last contiguous bullet line in that section.
    """
    if not doc_path or not os.path.exists(doc_path):
        return False
    with open(doc_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Locate the revision-history header.
    hdr_idx = None
    for i, ln in enumerate(lines):
        if ln.lstrip().startswith("#") and "Revision history" in ln:
            hdr_idx = i
            break
    if hdr_idx is None:
        # No section found: append one at the end of the doc.
        if lines and not lines[-1].endswith("\n"):
            lines[-1] += "\n"
        lines.append("\n## 🗒️ Revision history\n\n")
        lines.append(line + "\n")
        with open(doc_path, "w", encoding="utf-8") as f:
            f.writelines(lines)
        return True

    # Find the index of the last bullet ('- ') line within this section,
    # stopping at the next header (a line beginning with '#').
    last_bullet = None
    i = hdr_idx + 1
    while i < len(lines):
        stripped = lines[i].lstrip()
        if stripped.startswith("#"):
            break
        if stripped.startswith("- "):
            last_bullet = i
        i += 1

    insert_at = (last_bullet + 1) if last_bullet is not None else (hdr_idx + 1)
    new_line = line if line.endswith("\n") else line + "\n"
    lines.insert(insert_at, new_line)
    with open(doc_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    return True


def sibling_path(clip, suffix):
    """Given /…/vcf-sgi-s06.mp4 and 'a' -> /…/vcf-sgi-s06-a.mp4"""
    d = os.path.dirname(clip)
    base, ext = os.path.splitext(os.path.basename(clip))
    return os.path.join(d, f"{base}-{suffix}{ext}")


def thumb_sibling(thumb, suffix):
    d = os.path.dirname(thumb)
    base, ext = os.path.splitext(os.path.basename(thumb))
    return os.path.join(d, f"{base}-{suffix}{ext}")


def today():
    return datetime.date.today().isoformat()


# ---------------------------------------------------------------------------
# HTTP handler
# ---------------------------------------------------------------------------
class Handler(http.server.BaseHTTPRequestHandler):
    server_version = "ClipEditor/1.0"

    def log_message(self, fmt, *args):
        sys.stderr.write("  " + (fmt % args) + "\n")

    # -- helpers ----------------------------------------------------------
    def _send_json(self, obj, status=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _query(self):
        parsed = urllib.parse.urlparse(self.path)
        return parsed.path, urllib.parse.parse_qs(parsed.query)

    # -- GET --------------------------------------------------------------
    def do_GET(self):
        path, qs = self._query()
        try:
            if path == "/" or path == "/edit":
                self._serve_index()
            elif path == "/info":
                self._serve_info(qs)
            elif path == "/media":
                self._serve_media(qs)
            else:
                self._send_json({"ok": False, "error": "not found"}, 404)
        except BrokenPipeError:
            pass
        except Exception as e:
            self._send_json({"ok": False, "error": str(e)}, 500)

    def _serve_index(self):
        if not os.path.exists(INDEX_HTML):
            self._send_json({"ok": False, "error": "index.html missing"}, 500)
            return
        with open(INDEX_HTML, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _serve_info(self, qs):
        p = (qs.get("path") or [""])[0]
        if not p or not _is_allowed(p) or not os.path.isfile(p):
            self._send_json({"ok": False, "error": "invalid path"}, 400)
            return
        info = ffprobe_info(p)
        info["ok"] = True
        self._send_json(info)

    def _serve_media(self, qs):
        p = (qs.get("path") or [""])[0]
        if not p or not _is_allowed(p) or not os.path.isfile(p):
            self._send_json({"ok": False, "error": "invalid path"}, 400)
            return

        file_size = os.path.getsize(p)
        ctype = "video/mp4"
        range_header = self.headers.get("Range")

        if range_header:
            # Parse "bytes=START-END"
            m = re.match(r"bytes=(\d*)-(\d*)", range_header.strip())
            start = 0
            end = file_size - 1
            if m:
                if m.group(1):
                    start = int(m.group(1))
                if m.group(2):
                    end = int(m.group(2))
            start = max(0, start)
            end = min(end, file_size - 1)
            if start > end:
                self.send_response(416)
                self.send_header("Content-Range", f"bytes */{file_size}")
                self.end_headers()
                return
            length = end - start + 1
            self.send_response(206)
            self.send_header("Content-Type", ctype)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
            self.send_header("Content-Length", str(length))
            self.end_headers()
            self._stream_file(p, start, length)
        else:
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Length", str(file_size))
            self.end_headers()
            self._stream_file(p, 0, file_size)

    def _stream_file(self, path, start, length):
        chunk = 64 * 1024
        with open(path, "rb") as f:
            f.seek(start)
            remaining = length
            while remaining > 0:
                buf = f.read(min(chunk, remaining))
                if not buf:
                    break
                try:
                    self.wfile.write(buf)
                except (BrokenPipeError, ConnectionResetError):
                    break
                remaining -= len(buf)

    # -- POST -------------------------------------------------------------
    def do_POST(self):
        path, _ = self._query()
        if path != "/save":
            self._send_json({"ok": False, "error": "not found"}, 404)
            return
        try:
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length) if length else b"{}"
            payload = json.loads(raw.decode("utf-8"))
            result = self._handle_save(payload)
            self._send_json(result)
        except Exception as e:
            self._send_json({"ok": False, "error": str(e)}, 500)

    def _handle_save(self, p):
        op = p.get("op")
        clip = p.get("clip")
        thumb = p.get("thumb")
        scene = p.get("scene") or "?"
        doc = p.get("doc")

        if not clip or not _is_allowed(clip) or not os.path.isfile(clip):
            return {"ok": False, "error": "invalid clip path"}
        if op not in ("trim", "cut", "crop", "split"):
            return {"ok": False, "error": f"unknown op: {op}"}

        clip_dir = os.path.dirname(clip)
        tmp_out = os.path.join(clip_dir, ".clip-editor-tmp.mp4")

        # ----- SPLIT: produce new sibling files, do not touch original ----
        if op == "split":
            points = [float(x) for x in (p.get("points") or [])]
            points = sorted(set(round(x, 3) for x in points))
            if not points:
                return {"ok": False, "error": "split needs at least one point"}
            n = len(points) + 1
            suffixes = [chr(ord("a") + i) for i in range(n)]
            dst_paths = [sibling_path(clip, s) for s in suffixes]
            durations = op_split(clip, dst_paths, points)
            # Regenerate a thumbnail for each new snippet.
            thumb_paths = []
            if thumb and _is_allowed(thumb):
                for s, dst in zip(suffixes, dst_paths):
                    tp = thumb_sibling(thumb, s)
                    if _is_allowed(tp):
                        regen_thumb(dst, tp)
                        thumb_paths.append(tp)
            files_str = ", ".join(os.path.basename(x) for x in dst_paths)
            rev = (
                f"- **{today()}** — Scene {scene} split into {n} snippets "
                f"({files_str}) (clip editor). Slot the new files into the "
                f"storyboard as needed."
            )
            if doc and _is_allowed(doc):
                append_revision(doc, rev)
            return {
                "ok": True,
                "message": (
                    f"Split into {n} snippets:\n"
                    + "\n".join(
                        f"  {os.path.basename(d)}  ({dur}s)"
                        for d, dur in zip(dst_paths, durations)
                    )
                    + "\n\nThese are NEW sibling files — the original clip is "
                    "unchanged. Revision history updated."
                ),
                "newFiles": dst_paths,
                "thumbs": thumb_paths,
                "durations": durations,
            }

        # ----- TRIM / CUT / CROP: overwrite in place ----------------------
        if op == "trim":
            t_in = float(p.get("in", 0.0))
            t_out = float(p.get("out", 0.0))
            if t_out <= t_in:
                return {"ok": False, "error": "out must be greater than in"}
            op_trim(clip, tmp_out, t_in, t_out)
            change = f"trimmed to {fmt_t(t_in)}–{fmt_t(t_out)}"

        elif op == "cut":
            a = float(p.get("cutStart", 0.0))
            b = float(p.get("cutEnd", 0.0))
            if b <= a:
                return {"ok": False, "error": "cut end must be greater than start"}
            op_cut(clip, tmp_out, a, b)
            change = f"removed section {fmt_t(a)}–{fmt_t(b)}"

        elif op == "crop":
            crop = p.get("crop") or {}
            op_crop(
                clip, tmp_out,
                crop.get("x", 0), crop.get("y", 0),
                crop.get("w", 0), crop.get("h", 0),
            )
            change = "cropped & reframed to 9:16"

        else:
            return {"ok": False, "error": f"unknown operation: {op}"}

        # Back up original (once), then overwrite in place.
        backup_original(clip)
        os.replace(tmp_out, clip)

        # Regenerate thumbnail.
        if thumb and _is_allowed(thumb):
            regen_thumb(clip, thumb)

        new_info = ffprobe_info(clip)
        rev = f"- **{today()}** — Scene {scene} {change} (clip editor)."
        if doc and _is_allowed(doc):
            append_revision(doc, rev)

        return {
            "ok": True,
            "message": (
                f"Scene {scene} {change}. New duration {new_info['duration']}s "
                f"({new_info['width']}×{new_info['height']}). "
                "Clip overwritten in place; original backed up to originals/; "
                "thumbnail + revision history updated."
            ),
            "newDuration": new_info["duration"],
            "width": new_info["width"],
            "height": new_info["height"],
        }


def fmt_t(seconds):
    """Format seconds as M:SS."""
    seconds = max(0, int(round(seconds)))
    return f"{seconds // 60}:{seconds % 60:02d}"


class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    os.chdir(HERE)
    httpd = ThreadingServer(("127.0.0.1", PORT), Handler)
    base = f"http://localhost:{PORT}"
    print("=" * 60)
    print("  Clip Editor running")
    print(f"  {base}")
    print("=" * 60)
    print("  Open an Edit link from your storyboard, or build one:")
    print(f"  {base}/edit?clip=<abs.mp4>&thumb=<abs.jpg>&scene=<id>&doc=<abs.md>")
    print("  (URL-encode the path values)")
    print("  Ctrl-C to stop.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        httpd.shutdown()


if __name__ == "__main__":
    main()
