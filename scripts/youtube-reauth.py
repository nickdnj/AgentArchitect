#!/usr/bin/env python3
"""
Re-authenticate YouTube OAuth and save a new token.

Usage:
    python youtube-reauth.py [--port 8090]

Opens a browser window for OAuth consent, then saves the token to
~/.config/youtube-upload/token.pickle.
"""

import argparse
import os
import pickle

from google_auth_oauthlib.flow import InstalledAppFlow

TOKEN_FILE = os.path.expanduser("~/.config/youtube-upload/token.pickle")
CLIENT_SECRETS = os.path.expanduser("~/.config/mcp-gmail-personal/gcp-oauth.keys.json")

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
]


def main():
    parser = argparse.ArgumentParser(
        description="Re-authenticate YouTube OAuth credentials."
    )
    parser.add_argument(
        "--port", type=int, default=8090, help="Local port for OAuth callback (default: 8090)"
    )
    args = parser.parse_args()

    print("Starting YouTube OAuth flow...")
    print("A browser window will open -- sign in and authorize YouTube access.\n")

    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS, SCOPES)
    creds = flow.run_local_server(port=args.port, open_browser=True)

    os.makedirs(os.path.dirname(TOKEN_FILE), exist_ok=True)
    with open(TOKEN_FILE, "wb") as f:
        pickle.dump(creds, f)

    print(f"\nToken saved to {TOKEN_FILE}")
    print("You can now run youtube-upload.py")


if __name__ == "__main__":
    main()
