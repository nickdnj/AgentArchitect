#!/usr/bin/env python3
"""Lightweight storyboard review server. Serves the app and saves notes back to JSON."""
import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

DATA_FILE = os.path.join(os.path.dirname(__file__), "storyboard-data.json")
PORT = 8502

PROJECT_DIR = os.path.dirname(os.path.dirname(__file__))  # one level up from storyboard-app

class StoryboardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(__file__), **kwargs)

    def do_GET(self):
        # Serve /assets/ from the project root (one level up)
        if self.path.startswith("/assets/"):
            rel = self.path.lstrip("/")
            abs_path = os.path.join(PROJECT_DIR, rel)
            if os.path.isfile(abs_path):
                self.send_response(200)
                if abs_path.endswith(".png"):
                    self.send_header("Content-Type", "image/png")
                elif abs_path.endswith(".jpg") or abs_path.endswith(".jpeg"):
                    self.send_header("Content-Type", "image/jpeg")
                else:
                    self.send_header("Content-Type", "application/octet-stream")
                self.send_header("Content-Length", str(os.path.getsize(abs_path)))
                self.end_headers()
                with open(abs_path, "rb") as f:
                    self.wfile.write(f.read())
                return
        super().do_GET()

    def do_POST(self):
        if self.path == "/save":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                with open(DATA_FILE, "w") as f:
                    json.dump(data, f, indent=2)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "saved"}).encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

if __name__ == "__main__":
    print(f"Storyboard Review App running at http://localhost:{PORT}")
    print(f"Data file: {DATA_FILE}")
    HTTPServer(("", PORT), StoryboardHandler).serve_forever()
