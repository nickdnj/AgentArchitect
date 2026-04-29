#!/usr/bin/env python3
"""
Verify which YouTube channel the current OAuth token is authenticated against.

Usage:
    python youtube-whoami.py
"""

import os
import pickle
import sys

from google.auth.transport.requests import Request
from googleapiclient.discovery import build

TOKEN_FILE = os.path.expanduser("~/.config/youtube-upload/token.pickle")


def main():
    if not os.path.exists(TOKEN_FILE):
        print("ERROR: No token found. Run youtube-reauth.py first.")
        sys.exit(1)

    with open(TOKEN_FILE, "rb") as f:
        creds = pickle.load(f)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            print("ERROR: Token invalid or expired.")
            sys.exit(1)

    youtube = build("youtube", "v3", credentials=creds)
    resp = youtube.channels().list(part="snippet,id,statistics", mine=True).execute()
    items = resp.get("items", [])
    if not items:
        print("ERROR: No channel found for this token.")
        sys.exit(1)

    ch = items[0]
    print(f"Channel ID:    {ch['id']}")
    print(f"Channel Title: {ch['snippet']['title']}")
    print(f"Handle:        {ch['snippet'].get('customUrl', '(none)')}")
    print(f"Subscribers:   {ch['statistics'].get('subscriberCount', 'hidden')}")
    print()
    if ch["id"] == "UCfWC5cyYX15sSolvZya5RUQ":
        print("VERIFIED: Token is scoped to vistter2 Brand Account. Safe to upload.")
    else:
        print(f"MISMATCH: Expected UCfWC5cyYX15sSolvZya5RUQ but got {ch['id']}. DO NOT UPLOAD.")


if __name__ == "__main__":
    main()
