#!/usr/bin/env python3
"""
PDFScribe MCP Server
An MCP server for transcribing PDFs using Claude Sonnet 4 vision.
Wraps the pdfscribe_cli tool for use as Claude Code tools.
"""

import os
import sys
import json
import asyncio
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    print("ERROR: mcp package not installed. Run: pip install mcp", file=sys.stderr)
    sys.exit(1)

# Configuration from environment
PDFSCRIBE_PATH = Path(os.environ.get("PDFSCRIBE_CLI_PATH", "/Users/nickd/Workspaces/pdfscribe_cli"))
WORKSPACE_PATH = Path(os.environ.get("PDFSCRIBE_WORKSPACE", "/tmp/pdfscribe"))
OUTPUT_PATH = Path(os.environ.get("PDFSCRIBE_OUTPUT", str(WORKSPACE_PATH / "outputs")))

# Check for API key
if not os.environ.get("ANTHROPIC_API_KEY"):
    print("Warning: ANTHROPIC_API_KEY not set", file=sys.stderr)

# Ensure directories exist
WORKSPACE_PATH.mkdir(parents=True, exist_ok=True)
OUTPUT_PATH.mkdir(parents=True, exist_ok=True)

# Create MCP server
server = Server("pdfscribe-mcp")


@server.list_tools()
async def list_tools():
    """List available PDFScribe tools."""
    return [
        Tool(
            name="transcribe_pdf",
            description="Transcribe a PDF file to Markdown using Claude Sonnet 4 vision. Handles scanned/image-based PDFs with intelligent caching.",
            inputSchema={
                "type": "object",
                "properties": {
                    "pdf_path": {
                        "type": "string",
                        "description": "Absolute path to the PDF file to transcribe"
                    },
                    "output_path": {
                        "type": "string",
                        "description": "Output file path (optional, defaults to workspace/outputs/)"
                    },
                    "backstory": {
                        "type": "string",
                        "description": "Context about the document to help with transcription accuracy (optional)"
                    },
                    "verbose": {
                        "type": "boolean",
                        "description": "Enable verbose output (default: true)",
                        "default": True
                    }
                },
                "required": ["pdf_path"]
            }
        ),
        Tool(
            name="pdf_to_website",
            description="Convert a PDF or directory of PDFs into an interactive HTML website with image gallery and navigation.",
            inputSchema={
                "type": "object",
                "properties": {
                    "input_path": {
                        "type": "string",
                        "description": "Path to PDF file or directory of PDFs"
                    },
                    "output_dir": {
                        "type": "string",
                        "description": "Output directory for the website (optional)"
                    },
                    "title": {
                        "type": "string",
                        "description": "Website title (optional)"
                    },
                    "backstory": {
                        "type": "string",
                        "description": "Context about the documents (optional)"
                    }
                },
                "required": ["input_path"]
            }
        ),
        Tool(
            name="split_pdf",
            description="Split a large PDF into smaller chunks for easier processing.",
            inputSchema={
                "type": "object",
                "properties": {
                    "pdf_path": {
                        "type": "string",
                        "description": "Path to the PDF file to split"
                    },
                    "pages_per_chunk": {
                        "type": "integer",
                        "description": "Number of pages per chunk (default: 50)",
                        "default": 50
                    },
                    "output_dir": {
                        "type": "string",
                        "description": "Output directory for chunks (optional)"
                    }
                },
                "required": ["pdf_path"]
            }
        ),
        Tool(
            name="list_transcriptions",
            description="List all transcribed documents in the output directory.",
            inputSchema={
                "type": "object",
                "properties": {
                    "output_dir": {
                        "type": "string",
                        "description": "Directory to list (optional, defaults to workspace/outputs/)"
                    }
                }
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict):
    """Handle tool calls."""

    if name == "transcribe_pdf":
        pdf_path = Path(arguments["pdf_path"])

        if not pdf_path.exists():
            return [TextContent(type="text", text=f"Error: PDF not found at {pdf_path}")]

        # Determine output path (now outputs .md files with caching)
        output_path = arguments.get("output_path")
        if not output_path:
            output_path = OUTPUT_PATH / f"{pdf_path.stem}-transcribed.md"
        else:
            output_path = Path(output_path)

        # Build command
        cmd = [
            sys.executable,
            str(PDFSCRIBE_PATH / "pdfscribe_cli.py"),
            str(pdf_path),
            "-o", str(output_path)
        ]

        backstory = arguments.get("backstory")
        if backstory:
            cmd.extend(["-b", backstory])

        if arguments.get("verbose", True):
            cmd.append("-v")

        # Run transcription
        try:
            result = subprocess.run(
                cmd,
                cwd=str(PDFSCRIBE_PATH),
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout for large PDFs
            )

            if result.returncode != 0:
                return [TextContent(
                    type="text",
                    text=f"Error during transcription:\n{result.stderr}\n\nOutput:\n{result.stdout}"
                )]

            # Read the output file
            if output_path.exists():
                content_preview = output_path.read_text()[:2000]
                file_size = output_path.stat().st_size / 1024

                return [TextContent(
                    type="text",
                    text=f"Transcription complete!\n\n"
                         f"Output: {output_path}\n"
                         f"Size: {file_size:.1f} KB\n\n"
                         f"Preview (first 2000 chars):\n{content_preview}..."
                )]
            else:
                return [TextContent(
                    type="text",
                    text=f"Transcription ran but output file not found.\n\nStdout:\n{result.stdout}"
                )]

        except subprocess.TimeoutExpired:
            return [TextContent(type="text", text="Error: Transcription timed out (>10 minutes)")]
        except Exception as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    elif name == "pdf_to_website":
        input_path = Path(arguments["input_path"])

        if not input_path.exists():
            return [TextContent(type="text", text=f"Error: Input not found at {input_path}")]

        # Determine output directory
        output_dir = arguments.get("output_dir")
        if not output_dir:
            output_dir = OUTPUT_PATH / f"{input_path.stem}-website"
        else:
            output_dir = Path(output_dir)

        # Build command
        cmd = [
            sys.executable,
            str(PDFSCRIBE_PATH / "pdf2website.py"),
            str(input_path),
            "-o", str(output_dir)
        ]

        title = arguments.get("title")
        if title:
            cmd.extend(["-t", title])

        backstory = arguments.get("backstory")
        if backstory:
            cmd.extend(["-b", backstory])

        cmd.append("-v")

        # Run website generation
        try:
            result = subprocess.run(
                cmd,
                cwd=str(PDFSCRIBE_PATH),
                capture_output=True,
                text=True,
                timeout=1800  # 30 minute timeout
            )

            if result.returncode != 0:
                return [TextContent(
                    type="text",
                    text=f"Error during website generation:\n{result.stderr}\n\nOutput:\n{result.stdout}"
                )]

            # Check for index.html
            index_path = output_dir / "index.html"
            if index_path.exists():
                return [TextContent(
                    type="text",
                    text=f"Website generated!\n\n"
                         f"Output directory: {output_dir}\n"
                         f"Open in browser: file://{index_path}\n\n"
                         f"Process output:\n{result.stdout[-1000:]}"
                )]
            else:
                return [TextContent(
                    type="text",
                    text=f"Website generation ran but index.html not found.\n\n{result.stdout}"
                )]

        except subprocess.TimeoutExpired:
            return [TextContent(type="text", text="Error: Website generation timed out (>30 minutes)")]
        except Exception as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    elif name == "split_pdf":
        pdf_path = Path(arguments["pdf_path"])

        if not pdf_path.exists():
            return [TextContent(type="text", text=f"Error: PDF not found at {pdf_path}")]

        output_dir = arguments.get("output_dir", str(WORKSPACE_PATH / "split"))
        pages_per_chunk = arguments.get("pages_per_chunk", 50)

        cmd = [
            sys.executable,
            str(PDFSCRIBE_PATH / "src" / "split_pdf.py"),
            str(pdf_path),
            "--pages-per-chunk", str(pages_per_chunk),
            "--output-dir", output_dir
        ]

        try:
            result = subprocess.run(
                cmd,
                cwd=str(PDFSCRIBE_PATH),
                capture_output=True,
                text=True,
                timeout=300
            )

            if result.returncode != 0:
                return [TextContent(
                    type="text",
                    text=f"Error splitting PDF:\n{result.stderr}"
                )]

            return [TextContent(
                type="text",
                text=f"PDF split complete!\n\nOutput directory: {output_dir}\n\n{result.stdout}"
            )]

        except Exception as e:
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    elif name == "list_transcriptions":
        output_dir = Path(arguments.get("output_dir", str(OUTPUT_PATH)))

        if not output_dir.exists():
            return [TextContent(type="text", text=f"Output directory not found: {output_dir}")]

        # Find all markdown and html files
        md_files = list(output_dir.glob("*-transcribed.md"))
        html_dirs = [d for d in output_dir.iterdir() if d.is_dir() and (d / "index.html").exists()]

        result = f"Transcriptions in {output_dir}:\n\n"

        if md_files:
            result += "Markdown transcriptions:\n"
            for f in sorted(md_files):
                stat = f.stat()
                size = stat.st_size / 1024
                mtime = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M")
                result += f"  - {f.name} ({size:.1f} KB, {mtime})\n"

        if html_dirs:
            result += "\nWebsite transcriptions:\n"
            for d in sorted(html_dirs):
                result += f"  - {d.name}/ (open {d}/index.html)\n"

        if not md_files and not html_dirs:
            result += "No transcriptions found."

        return [TextContent(type="text", text=result)]

    else:
        return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    """Run the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
