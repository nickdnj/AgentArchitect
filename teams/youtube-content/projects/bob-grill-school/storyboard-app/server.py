#!/usr/bin/env python3
"""Bob's Grill School — storyboard review server.

Multi-episode storyboard app with the ONE-ASSET-PER-PAGE model: each page holds
exactly one image OR one video (never a gallery). Also serves the master shot
list (the field call sheet) as a printable view.

Single-user localhost app. Serves the SPA (index.html), streams assets from the
parent project's ./assets/ tree, handles per-page uploads/deletes, and auto-saves
storyboard-data.json. No auth, localhost only.

Data file lives at <project>/storyboard-data.json (one level above this app dir),
written by the Video Script Writer; this server reads/writes it in place.
"""
import datetime
import json
import os
import re
import secrets
import shutil
import tempfile
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_file, send_from_directory

# --- paths ------------------------------------------------------------------
APP_DIR = Path(__file__).resolve().parent
PROJECT_DIR = APP_DIR.parent  # storyboard-app sits inside <project>/
DATA_FILE = PROJECT_DIR / "storyboard-data.json"
ASSETS_DIR = PROJECT_DIR / "assets"
INDEX_FILE = APP_DIR / "index.html"
BACKUP_DIR = APP_DIR / "backups"
KEEP_BACKUPS = 15

# --- config -----------------------------------------------------------------
PORT = 8510  # bob-grill-school
MAX_UPLOAD_BYTES = 500 * 1024 * 1024  # 500 MB (4K phone clips)
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".heic"}
VIDEO_EXTS = {".mp4", ".mov", ".webm", ".m4v"}
PROTECTED_NAMES = {"storyboard-data.json", "server.py", "index.html", "README.md"}

CONTENT_TYPES = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".gif": "image/gif", ".webp": "image/webp", ".heic": "image/heic",
    ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm",
    ".m4v": "video/x-m4v", ".wav": "audio/wav", ".mp3": "audio/mpeg",
    ".txt": "text/plain", ".json": "application/json",
}

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES + (1024 * 1024)


# --- helpers ----------------------------------------------------------------
def slugify(name: str) -> str:
    stem = Path(name).stem.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", stem).strip("-")
    return (slug or "asset")[:48]


def short_id(n: int = 6) -> str:
    return secrets.token_hex(n // 2 + 1)[:n]


def safe_asset_path(rel: str) -> Path:
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
    abs_path = safe_asset_path(f"assets/{subpath}")
    if not abs_path.is_file():
        abort(404)
    mime = CONTENT_TYPES.get(abs_path.suffix.lower(), "application/octet-stream")
    return send_from_directory(str(abs_path.parent), abs_path.name, mimetype=mime, conditional=True)


def backup_current():
    """Roll a timestamped backup of the on-disk data file before overwriting it.
    Cheap insurance against a stale browser tab autosaving over good data."""
    if not DATA_FILE.exists():
        return
    BACKUP_DIR.mkdir(exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    try:
        shutil.copy2(DATA_FILE, BACKUP_DIR / f"storyboard-data.{ts}.json")
        baks = sorted(BACKUP_DIR.glob("storyboard-data.*.json"))
        for stale in baks[:-KEEP_BACKUPS]:
            stale.unlink()
    except OSError:
        pass  # never let a backup failure block a save


@app.route("/save", methods=["POST"])
def save():
    try:
        data = request.get_json(force=True, silent=False)
    except Exception as e:
        return jsonify({"error": f"invalid json: {e}"}), 400
    if not isinstance(data, dict):
        return jsonify({"error": "body must be a JSON object"}), 400
    # Guard: refuse an obviously-empty payload (stale tab / load failure) that would
    # clobber a populated file. A real edit always has episodes.
    if not data.get("episodes") and DATA_FILE.exists():
        return jsonify({"error": "refused: payload has no episodes (stale tab?)"}), 409
    backup_current()
    try:
        atomic_write_json(DATA_FILE, data)
    except OSError as e:
        return jsonify({"error": f"write failed: {e}"}), 500
    return jsonify({"status": "saved"})


@app.route("/upload", methods=["POST"])
def upload():
    """Upload exactly one asset for one episode/page. Enforces one-asset-per-page
    at the data layer is the client's job; here we just store the file and return
    its relative path + type."""
    ep_raw = request.form.get("episode")
    page_raw = request.form.get("page")
    kind = request.form.get("kind", "").lower()
    f = request.files.get("file")

    if ep_raw is None or not ep_raw.isdigit():
        return jsonify({"error": "missing or invalid episode"}), 400
    if page_raw is None or not page_raw.isdigit():
        return jsonify({"error": "missing or invalid page"}), 400
    ep, page = int(ep_raw), int(page_raw)
    if kind not in ("image", "video"):
        return jsonify({"error": "kind must be 'image' or 'video'"}), 400
    if not f or not f.filename:
        return jsonify({"error": "no file"}), 400

    ext = Path(f.filename).suffix.lower()
    allowed = IMAGE_EXTS if kind == "image" else VIDEO_EXTS
    if ext not in allowed:
        return jsonify({"error": f"extension {ext or '(none)'} not allowed for {kind}"}), 400

    sub = "images" if kind == "image" else "videos"
    target_dir = ASSETS_DIR / sub
    target_dir.mkdir(parents=True, exist_ok=True)

    tag = f"ep{ep:02d}-p{page:02d}"
    slug = slugify(f.filename)
    dest = target_dir / f"{tag}-{slug}-{short_id()}{ext}"

    fd, tmp = tempfile.mkstemp(prefix=".upload-", dir=str(target_dir))
    try:
        with os.fdopen(fd, "wb") as out:
            while True:
                chunk = f.stream.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
        if dest.exists():
            dest = target_dir / f"{tag}-{slug}-{short_id()}{ext}"
        if os.path.getsize(tmp) > MAX_UPLOAD_BYTES:
            os.unlink(tmp)
            return jsonify({"error": f"file exceeds {MAX_UPLOAD_BYTES // (1024*1024)} MB"}), 413
        os.replace(tmp, dest)
    except Exception as e:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        return jsonify({"error": f"upload failed: {e}"}), 500

    return jsonify({"status": "ok", "asset": {"path": f"assets/{sub}/{dest.name}", "type": kind}})


@app.route("/delete-asset", methods=["POST"])
def delete_asset():
    try:
        body = request.get_json(force=True, silent=False) or {}
    except Exception as e:
        return jsonify({"error": f"invalid json: {e}"}), 400
    abs_path = safe_asset_path(body.get("path", ""))
    if not abs_path.is_file():
        return jsonify({"error": "file not found"}), 404
    try:
        abs_path.unlink()
    except OSError as e:
        return jsonify({"error": f"delete failed: {e}"}), 500
    return jsonify({"status": "deleted"})


if __name__ == "__main__":
    print(f"Bob's Grill School — Storyboard App running at http://localhost:{PORT}")
    print(f"Data file: {DATA_FILE}")
    print(f"Assets:    {ASSETS_DIR}")
    app.run(host="127.0.0.1", port=PORT, debug=False, use_reloader=False)
