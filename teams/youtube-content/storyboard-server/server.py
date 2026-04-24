#!/usr/bin/env python3
"""Storyboard review server — multi-tenant (Phase 1).

One shared Flask app that auto-discovers every YouTube project's storyboard.
Replaces the per-project `storyboard-app/server.py` copies. Each project
lives under <projects_dir>/<slug>/ and is considered "present" when
<slug>/storyboard-app/storyboard-data.json exists.

No auth, no logging framework, no docker. Single port 8500, localhost only.
"""
import json
import os
import re
import secrets
import subprocess
import tempfile
from datetime import datetime
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_file, send_from_directory

# --- config -----------------------------------------------------------------
APP_DIR = Path(__file__).resolve().parent
# APP_DIR = .../teams/youtube-content/storyboard-server
# The projects live at the sibling directory: .../teams/youtube-content/projects
DEFAULT_PROJECTS_DIR = APP_DIR.parent / "projects"
PROJECTS_DIR = Path(os.environ.get("PROJECTS_DIR", str(DEFAULT_PROJECTS_DIR))).resolve()

PORT = 8500
MAX_UPLOAD_BYTES = 500 * 1024 * 1024  # 500 MB
IMAGE_EXTS = {".png", ".jpg", ".jpeg"}
VIDEO_EXTS = {".mp4", ".mov", ".webm"}
PROTECTED_NAMES = {"storyboard-data.json", "server.py", "index.html", "README.md"}
SLUG_RE = re.compile(r"^[a-z0-9-]+$")
IMAGE_MIN_SECONDS = 10  # floor — images must be on screen >= this long

INDEX_FILE = APP_DIR / "index.html"
PICKER_FILE = APP_DIR / "picker.html"

CONTENT_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".txt": "text/plain",
    ".json": "application/json",
}

EMPTY_SKELETON = {
    "project": "",
    "total_runtime": "",
    "scenes": [],
    "thumbnails": [],
}

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES + (1024 * 1024)


# --- helpers ----------------------------------------------------------------
def slugify_filename(name: str) -> str:
    stem = Path(name).stem.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", stem).strip("-")
    return (slug or "asset")[:48]


def short_id(n: int = 6) -> str:
    return secrets.token_hex(n // 2 + 1)[:n]


def valid_slug(slug: str) -> bool:
    return bool(slug) and bool(SLUG_RE.match(slug)) and len(slug) <= 80


def resolve_project_root(slug: str) -> Path:
    """Validate slug and return absolute project root, or 404.

    Enforces: slug matches ^[a-z0-9-]+$, resolved path is a child of
    PROJECTS_DIR, and storyboard-data.json exists.
    """
    if not valid_slug(slug):
        abort(404)
    root = (PROJECTS_DIR / slug).resolve()
    try:
        root.relative_to(PROJECTS_DIR)
    except ValueError:
        abort(404)
    if not (root / "storyboard-app" / "storyboard-data.json").is_file():
        abort(404)
    return root


def project_paths(slug: str):
    root = resolve_project_root(slug)
    return {
        "root": root,
        "data_file": root / "storyboard-app" / "storyboard-data.json",
        "assets_dir": root / "assets",
        "narration_dir": root / "assets" / "audio" / "narration",
    }


def safe_asset_path(project_root: Path, rel: str) -> Path:
    """Resolve an assets/-relative path under a project. Rejects traversal."""
    if not rel or rel.startswith("/") or ".." in Path(rel).parts:
        abort(400, "invalid path")
    if not rel.startswith("assets/"):
        abort(400, "path must start with assets/")
    assets_dir = (project_root / "assets").resolve()
    abs_path = (project_root / rel).resolve()
    try:
        abs_path.relative_to(assets_dir)
    except ValueError:
        abort(400, "path escapes assets directory")
    if abs_path.name in PROTECTED_NAMES:
        abort(400, "protected file")
    return abs_path


def ffprobe_duration(path: Path) -> float:
    """Return media duration in seconds via ffprobe. Returns 0.0 on any failure."""
    try:
        r = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(path),
            ],
            capture_output=True, text=True, timeout=10,
        )
        if r.returncode == 0:
            return float(r.stdout.strip() or 0.0)
    except (subprocess.SubprocessError, ValueError, FileNotFoundError):
        pass
    return 0.0


def scene_budget(scene: dict, project_root: Path) -> dict:
    """Compute pacing budget for a scene.

    Rule: scene_duration = max(narration_duration, sum(video_native_durations)).
    Images must be on screen >= IMAGE_MIN_SECONDS. max_images is
    floor((scene_duration - video_time) / IMAGE_MIN_SECONDS).
    """
    sid = scene.get("id")
    narr_rel = scene.get("narration_audio")
    if not narr_rel and isinstance(sid, int) and sid >= 0:
        narr_rel = f"assets/audio/narration/scene-{int(sid):02d}.wav"

    narration_sec = 0.0
    if narr_rel:
        try:
            narr_abs = safe_asset_path(project_root, narr_rel)
            if narr_abs.is_file():
                narration_sec = ffprobe_duration(narr_abs)
        except Exception:
            narration_sec = 0.0

    assets = scene.get("assets") or []
    video_sec = 0.0
    attached_images = 0
    for a in assets:
        if not isinstance(a, dict):
            continue
        atype = a.get("type")
        apath = a.get("path") or ""
        if atype == "video" and apath:
            try:
                pabs = safe_asset_path(project_root, apath)
                if pabs.is_file():
                    video_sec += ffprobe_duration(pabs)
            except Exception:
                pass
        elif atype == "image":
            attached_images += 1

    scene_sec = max(narration_sec, video_sec)
    image_sec = max(0.0, scene_sec - video_sec)
    max_images = int(image_sec // IMAGE_MIN_SECONDS) if image_sec > 0 else 0

    # Safety floor: short narration-only scenes still get 1 image slot
    # so the scene isn't blank (matches assembler behavior).
    has_video_to_fill = any(
        isinstance(a, dict) and a.get("type") == "video" and (a.get("path") or "")
        for a in assets
    )
    if attached_images > 0 and not has_video_to_fill and max_images == 0:
        max_images = 1

    # Status semantics (source of truth for UI colors and downstream tools):
    #   over        — attached > max, assembler will drop trailing images (RED)
    #   at_capacity — attached == max, every slot filled optimally (GREEN)
    #   under       — attached < max, there's room for more images (BLUE)
    #   ok          — no image slots (video-driven or empty scene), neutral
    if max_images == 0:
        status = "ok"
    elif attached_images > max_images:
        status = "over"
    elif attached_images == max_images:
        status = "at_capacity"
    else:
        status = "under"

    mode = "video-driven" if video_sec > narration_sec and video_sec > 0 else "narration-driven"

    return {
        "narration_seconds": round(narration_sec, 2),
        "video_seconds": round(video_sec, 2),
        "scene_seconds": round(scene_sec, 2),
        "image_seconds": round(image_sec, 2),
        "max_images": max_images,
        "attached_images": attached_images,
        "mode": mode,
        "status": status,
        "image_min_seconds": IMAGE_MIN_SECONDS,
    }


def atomic_write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".storyboard-", suffix=".json", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(tmp, path)
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def discover_projects():
    """Glob all projects with a storyboard-data.json. Fast enough to skip caching."""
    out = []
    if not PROJECTS_DIR.is_dir():
        return out
    for data_file in sorted(PROJECTS_DIR.glob("*/storyboard-app/storyboard-data.json")):
        slug = data_file.parent.parent.name
        if not valid_slug(slug):
            continue
        try:
            data = json.loads(data_file.read_text(encoding="utf-8"))
        except Exception:
            data = {}
        scenes = data.get("scenes") or []
        thumbs = data.get("thumbnails") or []
        notes_count = sum(
            1 for s in scenes if isinstance(s, dict) and (s.get("notes") or "").strip()
        )
        notes_count += sum(
            1 for t in thumbs if isinstance(t, dict) and (t.get("notes") or "").strip()
        )
        # Asset count: total across scenes + thumbs; fall back to legacy image_path.
        asset_count = 0
        for obj in list(scenes) + list(thumbs):
            if not isinstance(obj, dict):
                continue
            a = obj.get("assets")
            if isinstance(a, list):
                asset_count += len(a)
            elif obj.get("image_path"):
                asset_count += 1
        try:
            mtime = data_file.stat().st_mtime
            last_modified = datetime.fromtimestamp(mtime).isoformat(timespec="seconds")
        except OSError:
            last_modified = None
        out.append({
            "slug": slug,
            "title": data.get("project") or slug,
            "scene_count": len(scenes),
            "asset_count": asset_count,
            "notes_count": notes_count,
            "last_modified": last_modified,
        })
    return out


# --- picker / discovery routes ---------------------------------------------
@app.route("/")
def picker():
    return send_file(PICKER_FILE)


@app.route("/api/projects")
def api_projects():
    return jsonify(discover_projects())


@app.route("/api/projects/new", methods=["POST"])
def api_projects_new():
    try:
        body = request.get_json(force=True, silent=False) or {}
    except Exception as e:
        return jsonify({"error": f"invalid json: {e}"}), 400
    slug = (body.get("slug") or "").strip()
    title = (body.get("title") or "").strip()
    if not valid_slug(slug):
        return jsonify({"error": "slug must match ^[a-z0-9-]+$"}), 400
    if not title:
        return jsonify({"error": "title is required"}), 400
    root = (PROJECTS_DIR / slug).resolve()
    try:
        root.relative_to(PROJECTS_DIR)
    except ValueError:
        return jsonify({"error": "invalid slug"}), 400
    data_file = root / "storyboard-app" / "storyboard-data.json"
    if data_file.exists():
        return jsonify({"error": f"project '{slug}' already exists"}), 409
    skeleton = dict(EMPTY_SKELETON)
    skeleton["project"] = title
    try:
        atomic_write_json(data_file, skeleton)
    except OSError as e:
        return jsonify({"error": f"create failed: {e}"}), 500
    return jsonify({"status": "created", "slug": slug, "url": f"/p/{slug}/"}), 201


# --- per-project routes -----------------------------------------------------
@app.route("/p/<slug>/")
def project_index(slug):
    resolve_project_root(slug)  # validates
    return send_file(INDEX_FILE)


@app.route("/p/<slug>/storyboard-data.json")
def project_data(slug):
    paths = project_paths(slug)
    return send_file(paths["data_file"], mimetype="application/json")


@app.route("/p/<slug>/save", methods=["POST"])
def project_save(slug):
    paths = project_paths(slug)
    try:
        data = request.get_json(force=True, silent=False)
    except Exception as e:
        return jsonify({"error": f"invalid json: {e}"}), 400
    if not isinstance(data, dict):
        return jsonify({"error": "body must be a JSON object"}), 400
    try:
        atomic_write_json(paths["data_file"], data)
    except OSError as e:
        return jsonify({"error": f"write failed: {e}"}), 500
    return jsonify({"status": "saved"})


@app.route("/p/<slug>/upload", methods=["POST"])
def project_upload(slug):
    paths = project_paths(slug)
    scene_id_raw = request.form.get("scene_id")
    kind = request.form.get("kind", "").lower()
    f = request.files.get("file")

    if scene_id_raw is None or not scene_id_raw.lstrip("-").isdigit():
        return jsonify({"error": "missing or invalid scene_id"}), 400
    scene_id = int(scene_id_raw)
    if kind not in ("image", "video"):
        return jsonify({"error": "kind must be 'image' or 'video'"}), 400
    if not f or not f.filename:
        return jsonify({"error": "no file"}), 400

    ext = Path(f.filename).suffix.lower()
    allowed = IMAGE_EXTS if kind == "image" else VIDEO_EXTS
    if ext not in allowed:
        return jsonify({"error": f"extension {ext or '(none)'} not allowed for {kind}"}), 400

    sub = "images" if kind == "image" else "videos"
    target_dir = paths["assets_dir"] / sub
    target_dir.mkdir(parents=True, exist_ok=True)

    scene_tag = "thumb" if scene_id < 0 else f"scene-{scene_id:02d}"
    slug_fn = slugify_filename(f.filename)
    fname = f"{scene_tag}-{slug_fn}-{short_id()}{ext}"
    dest = target_dir / fname

    fd, tmp = tempfile.mkstemp(prefix=".upload-", dir=str(target_dir))
    try:
        with os.fdopen(fd, "wb") as out:
            while True:
                chunk = f.stream.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
        if dest.exists():
            dest = target_dir / f"{scene_tag}-{slug_fn}-{short_id()}{ext}"
        if os.path.getsize(tmp) > MAX_UPLOAD_BYTES:
            os.unlink(tmp)
            return jsonify({"error": f"file exceeds {MAX_UPLOAD_BYTES // (1024 * 1024)} MB"}), 413
        os.replace(tmp, dest)
    except Exception as e:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        return jsonify({"error": f"upload failed: {e}"}), 500

    rel_path = f"assets/{sub}/{dest.name}"
    return jsonify({
        "status": "ok",
        "asset": {"path": rel_path, "type": kind, "order": 0},
    })


@app.route("/p/<slug>/delete-asset", methods=["POST"])
def project_delete_asset(slug):
    paths = project_paths(slug)
    try:
        body = request.get_json(force=True, silent=False) or {}
    except Exception as e:
        return jsonify({"error": f"invalid json: {e}"}), 400
    rel = body.get("path", "")
    abs_path = safe_asset_path(paths["root"], rel)
    if not abs_path.is_file():
        return jsonify({"error": "file not found"}), 404
    try:
        abs_path.unlink()
    except OSError as e:
        return jsonify({"error": f"delete failed: {e}"}), 500
    return jsonify({"status": "deleted"})


@app.route("/p/<slug>/budget")
def project_budget(slug):
    """Per-scene pacing budget: narration time, video time, scene length, image slots."""
    paths = project_paths(slug)
    result = {}
    try:
        data = json.loads(paths["data_file"].read_text(encoding="utf-8"))
    except Exception:
        return jsonify(result)
    for s in data.get("scenes", []):
        sid = s.get("id")
        if sid is None:
            continue
        result[str(sid)] = scene_budget(s, paths["root"])
    return jsonify(result)


@app.route("/p/<slug>/audio-manifest")
def project_audio_manifest(slug):
    paths = project_paths(slug)
    manifest = {}
    try:
        data = json.loads(paths["data_file"].read_text(encoding="utf-8"))
    except Exception:
        return jsonify(manifest)
    for s in data.get("scenes", []):
        sid = s.get("id")
        if sid is None:
            continue
        rel = s.get("narration_audio") or f"assets/audio/narration/scene-{int(sid):02d}.wav"
        try:
            p = safe_asset_path(paths["root"], rel)
            manifest[str(sid)] = p.is_file()
        except Exception:
            manifest[str(sid)] = False
    return jsonify(manifest)


@app.route("/p/<slug>/assets/<path:subpath>")
def project_asset(slug, subpath):
    paths = project_paths(slug)
    rel = f"assets/{subpath}"
    abs_path = safe_asset_path(paths["root"], rel)
    if not abs_path.is_file():
        abort(404)
    mime = CONTENT_TYPES.get(abs_path.suffix.lower(), "application/octet-stream")
    return send_from_directory(str(abs_path.parent), abs_path.name, mimetype=mime, conditional=True)


# --- error handlers ---------------------------------------------------------
@app.errorhandler(404)
def handle_404(e):
    desc = getattr(e, "description", "not found")
    if request.path.startswith("/api/"):
        return jsonify({"error": desc}), 404
    return desc, 404


@app.errorhandler(400)
def handle_400(e):
    desc = getattr(e, "description", "bad request")
    if request.path.startswith("/api/") or request.path.startswith("/p/"):
        return jsonify({"error": desc}), 400
    return desc, 400


if __name__ == "__main__":
    print(f"Storyboard Review Server (multi-tenant) at http://localhost:{PORT}")
    print(f"Projects dir: {PROJECTS_DIR}")
    found = discover_projects()
    print(f"Discovered {len(found)} project(s):")
    for p in found:
        print(f"  - {p['slug']}  ({p['scene_count']} scenes, {p['asset_count']} assets)")
    app.run(host="127.0.0.1", port=PORT, debug=False, use_reloader=False)
