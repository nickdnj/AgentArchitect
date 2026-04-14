#!/usr/bin/env python3
"""
Upload a video to YouTube via the YouTube Data API v3 with scheduled publishing.

Usage:
    python youtube-upload-scheduled.py --metadata metadata.json --video video.mp4

Metadata JSON should contain:
  - title, description, tags, category (standard fields)
  - publishAt: ISO 8601 UTC timestamp (e.g. "2026-04-16T14:00:00Z")
    When publishAt is set, video is uploaded as "private" and scheduled.
    Without publishAt, uses the visibility field (public/unlisted/private).

Prints JSON result to stdout on success.
"""

import argparse
import json
import os
import pickle
import sys

from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

TOKEN_FILE = os.path.expanduser("~/.config/youtube-upload/token.pickle")

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
]

CATEGORY_MAP = {
    "Education": "27",
    "People & Blogs": "22",
    "Science & Technology": "28",
    "Entertainment": "24",
    "Film & Animation": "1",
    "Music": "10",
    "Gaming": "20",
    "Comedy": "23",
    "News & Politics": "25",
    "Howto & Style": "26",
    "Travel & Events": "19",
}


def load_credentials():
    """Load and refresh OAuth credentials from token.pickle."""
    creds = None
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "rb") as f:
            creds = pickle.load(f)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing expired token...", file=sys.stderr)
            creds.refresh(Request())
            with open(TOKEN_FILE, "wb") as f:
                pickle.dump(creds, f)
            print("Token refreshed and saved.", file=sys.stderr)
        else:
            print(
                "ERROR: No valid token. Run youtube-reauth.py to authenticate.",
                file=sys.stderr,
            )
            sys.exit(1)

    return creds


def upload_video(youtube, video_path, meta):
    """Upload video and return the API response."""
    category_id = CATEGORY_MAP.get(meta.get("category", ""), "22")
    publish_at = meta.get("publishAt") or meta.get("publish_at")

    if publish_at:
        # Scheduled: upload as private with publishAt
        privacy_status = "private"
        print(f"Scheduling for: {publish_at}", file=sys.stderr)
    else:
        privacy_status = meta.get("visibility", "public")

    status_obj = {
        "privacyStatus": privacy_status,
        "selfDeclaredMadeForKids": False,
    }
    if publish_at:
        status_obj["publishAt"] = publish_at

    body = {
        "snippet": {
            "title": meta["title"][:100],
            "description": meta.get("description", "")[:5000],
            "tags": meta.get("tags", [])[:500],
            "categoryId": category_id,
        },
        "status": status_obj,
    }

    media = MediaFileUpload(
        video_path,
        mimetype="video/mp4",
        resumable=True,
        chunksize=10 * 1024 * 1024,
    )

    request = youtube.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media,
    )

    file_size_mb = os.path.getsize(video_path) / 1024 / 1024
    print(f"Uploading {video_path} ({file_size_mb:.1f} MB)...", file=sys.stderr)

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"Upload progress: {int(status.progress() * 100)}%", file=sys.stderr)

    return response


def set_thumbnail(youtube, video_id, thumbnail_path):
    """Upload a custom thumbnail for the video."""
    ext = os.path.splitext(thumbnail_path)[1].lower()
    mime = "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png"
    print(f"Setting thumbnail: {thumbnail_path}", file=sys.stderr)
    youtube.thumbnails().set(
        videoId=video_id,
        media_body=MediaFileUpload(thumbnail_path, mimetype=mime),
    ).execute()
    print("Thumbnail set.", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(
        description="Upload a video to YouTube with optional scheduled publishing."
    )
    parser.add_argument("--metadata", required=True, help="Path to metadata JSON file")
    parser.add_argument("--video", required=True, help="Path to video file (overrides metadata)")
    parser.add_argument("--thumbnail", help="Path to thumbnail image")
    parser.add_argument(
        "--visibility",
        choices=["public", "unlisted", "private"],
        help="Override visibility (ignored if publishAt is set in metadata)",
    )
    args = parser.parse_args()

    # Load metadata
    with open(args.metadata) as f:
        meta = json.load(f)

    # CLI overrides
    if args.visibility and not (meta.get("publishAt") or meta.get("publish_at")):
        meta["visibility"] = args.visibility

    video_path = args.video
    thumbnail_path = args.thumbnail or meta.get("thumbnail")

    print(f"Title: {meta['title']}", file=sys.stderr)
    publish_at = meta.get("publishAt") or meta.get("publish_at")
    if publish_at:
        print(f"Scheduled: {publish_at}", file=sys.stderr)
    else:
        print(f"Visibility: {meta.get('visibility', 'public')}", file=sys.stderr)

    # Authenticate
    creds = load_credentials()
    youtube = build("youtube", "v3", credentials=creds)

    # Upload
    response = upload_video(youtube, video_path, meta)
    video_id = response["id"]
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    shorts_url = f"https://www.youtube.com/shorts/{video_id}"

    print(f"Video uploaded: {video_url}", file=sys.stderr)

    # Thumbnail
    if thumbnail_path and os.path.exists(thumbnail_path):
        set_thumbnail(youtube, video_id, thumbnail_path)

    # Print JSON result to stdout
    result = {
        "video_id": video_id,
        "url": video_url,
        "shorts_url": shorts_url,
        "title": meta["title"],
        "scheduled": publish_at or None,
        "visibility": response.get("status", {}).get("privacyStatus", "unknown"),
        "status": "scheduled" if publish_at else "uploaded",
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
