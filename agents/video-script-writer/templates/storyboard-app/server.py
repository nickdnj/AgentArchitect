#!/usr/bin/env python3
"""Storyboard review server (v2).

Single-user localhost app. Serves a static SPA (index.html), streams assets
from the parent project's ./assets/ tree, and handles uploads/deletes plus
auto-save of storyboard-data.json. Keep it simple: no auth, no logging
framework, no CORS-to-the-world. Flask because multipart handling on
http.server was painful.
"""
import json
import os
import re
import secrets
import tempfile
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_file, send_from_directory

# --- paths ------------------------------------------------------------------
APP_DIR = Path(__file__).resolve().parent
PROJECT_DIR = APP_DIR.parent  # storyboard-app sits inside <project>/
DATA_FILE = APP_DIR / "storyboard-data.json"
ASSETS_DIR = PROJECT_DIR / "assets"
NARRATION_DIR = ASSETS_DIR / "audio" / "narration"
INDEX_FILE = APP_DIR / "index.html"

# --- config -----------------------------------------------------------------
PORT = 8501  # override per-project
MAX_UPLOAD_BYTES = 500 * 1024 * 1024  # 500 MB (accommodates 4K drone clips; tune per project)
IMAGE_EXTS = {".png", ".jpg", ".jpeg"}
VIDEO_EXTS = {".mp4", ".mov", ".webm"}
PROTECTED_NAMES = {"storyboard-data.json", "server.py", "index.html", "README.md"}

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

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES + (1024 * 1024)  # tiny headroom


# --- helpers ----------------------------------------------------------------
def slugify(name: str) -> str:
    stem = Path(name).stem.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", stem).strip("-")
    return (slug or "asset")[:48]


def short_id(n: int = 6) -> str:
    return secrets.token_hex(n // 2 + 1)[:n]


def safe_asset_path(rel: str) -> Path:
    """Resolve a user-supplied relative path under assets/. Rejects traversal."""
    if not rel or rel.startswith("/") or ".." in Path(rel).parts:
        abort(400, "invalid path")
    if not rel.startswith("assets/"):
        abort(400, "path must start with assets/")
    abs_path = (PROJECT_DIR / rel).resolve()
    try:
        abs_path.relative_to(ASSETS_DIR.resolve())
    except ValueError:
        abort(400, "path escapes assets directory")
    if abs_path.name in PROTECTED_NAMES:
        abort(400, "protected file")
    return abs_path


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


# --- routes -----------------------------------------------------------------
@app.route("/")
def index():
    return send_file(INDEX_FILE)


@app.route("/storyboard-data.json")
def storyboard_data():
    if not DATA_FILE.exists():
        return jsonify({}), 404
    return send_file(DATA_FILE, mimetype="application/json")


@app.route("/assets/<path:subpath>")
def serve_asset(subpath):
    rel = f"assets/{subpath}"
    abs_path = safe_asset_path(rel)
    if not abs_path.is_file():
        abort(404)
    mime = CONTENT_TYPES.get(abs_path.suffix.lower(), "application/octet-stream")
    resp = send_from_directory(str(abs_path.parent), abs_path.name, mimetype=mime, conditional=True)
    return resp


@app.route("/save", methods=["POST"])
def save():
    try:
        data = request.get_json(force=True, silent=False)
    except Exception as e:
        return jsonify({"error": f"invalid json: {e}"}), 400
    if not isinstance(data, dict):
        return jsonify({"error": "body must be a JSON object"}), 400
    try:
        atomic_write_json(DATA_FILE, data)
    except OSError as e:
        return jsonify({"error": f"write failed: {e}"}), 500
    return jsonify({"status": "saved"})


@app.route("/upload", methods=["POST"])
def upload():
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

    # size check — stream to temp, then rename. Werkzeug already capped via MAX_CONTENT_LENGTH.
    sub = "images" if kind == "image" else "videos"
    target_dir = ASSETS_DIR / sub
    target_dir.mkdir(parents=True, exist_ok=True)

    scene_tag = f"thumb" if scene_id < 0 else f"scene-{scene_id:02d}"
    slug = slugify(f.filename)
    fname = f"{scene_tag}-{slug}-{short_id()}{ext}"
    dest = target_dir / fname

    # Write to a sibling temp file, check size, then rename. Flask already enforces MAX_CONTENT_LENGTH
    # at the wsgi layer; this is defense-in-depth.
    fd, tmp = tempfile.mkstemp(prefix=".upload-", dir=str(target_dir))
    try:
        with os.fdopen(fd, "wb") as out:
            while True:
                chunk = f.stream.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
        if dest.exists():  # defensive — short_id collision
            dest = target_dir / f"{scene_tag}-{slug}-{short_id()}{ext}"
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


@app.route("/delete-asset", methods=["POST"])
def delete_asset():
    try:
        body = request.get_json(force=True, silent=False) or {}
    except Exception as e:
        return jsonify({"error": f"invalid json: {e}"}), 400
    rel = body.get("path", "")
    abs_path = safe_asset_path(rel)
    if not abs_path.is_file():
        return jsonify({"error": "file not found"}), 404
    try:
        abs_path.unlink()
    except OSError as e:
        return jsonify({"error": f"delete failed: {e}"}), 500
    return jsonify({"status": "deleted"})


@app.route("/audio-manifest")
def audio_manifest():
    """Return {scene_id: bool} for every scene in storyboard-data.json.

    Looks at scene.narration_audio if set, else falls back to the convention
    assets/audio/narration/scene-NN.wav.
    """
    manifest = {}
    if not DATA_FILE.exists():
        return jsonify(manifest)
    try:
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except Exception:
        return jsonify(manifest)
    for s in data.get("scenes", []):
        sid = s.get("id")
        if sid is None:
            continue
        rel = s.get("narration_audio") or f"assets/audio/narration/scene-{int(sid):02d}.wav"
        try:
            p = safe_asset_path(rel)
            manifest[str(sid)] = p.is_file()
        except Exception:
            manifest[str(sid)] = False
    return jsonify(manifest)


if __name__ == "__main__":
    print(f"Storyboard Review App v2 running at http://localhost:{PORT}")
    print(f"Data file: {DATA_FILE}")
    print(f"Assets:    {ASSETS_DIR}")
    app.run(host="127.0.0.1", port=PORT, debug=False, use_reloader=False)
