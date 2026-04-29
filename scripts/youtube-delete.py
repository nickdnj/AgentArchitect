#!/usr/bin/env python3
"""
Delete YouTube videos by ID using the existing OAuth token.

Usage:
    python youtube-delete.py --ids VIDEO_ID [VIDEO_ID ...]
"""

import argparse
import os
import pickle
import sys

from google.auth.transport.requests import Request
from googleapiclient.discovery import build

TOKEN_FILE = os.path.expanduser("~/.config/youtube-upload/token.pickle")

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
]


def load_credentials():
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
        else:
            print("ERROR: No valid token. Run youtube-reauth.py first.", file=sys.stderr)
            sys.exit(1)
    return creds


def get_channel_info(youtube):
    resp = youtube.channels().list(part="snippet,id", mine=True).execute()
    items = resp.get("items", [])
    if not items:
        return None, None
    ch = items[0]
    return ch["id"], ch["snippet"]["title"]


def delete_video(youtube, video_id):
    try:
        youtube.videos().delete(id=video_id).execute()
        print(f"  DELETED: {video_id}")
        return True
    except Exception as e:
        print(f"  FAILED to delete {video_id}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Delete YouTube videos by ID.")
    parser.add_argument("--ids", nargs="+", required=True, help="Video IDs to delete")
    args = parser.parse_args()

    creds = load_credentials()
    youtube = build("youtube", "v3", credentials=creds)

    channel_id, channel_title = get_channel_info(youtube)
    print(f"Authenticated channel: {channel_title} ({channel_id})")
    print()

    results = {}
    for vid_id in args.ids:
        print(f"Deleting {vid_id}...")
        results[vid_id] = delete_video(youtube, vid_id)

    print()
    print("Summary:")
    for vid_id, success in results.items():
        status = "DELETED" if success else "FAILED"
        print(f"  {vid_id}: {status}")


if __name__ == "__main__":
    main()
