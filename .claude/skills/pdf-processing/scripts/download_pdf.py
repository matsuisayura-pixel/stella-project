#!/usr/bin/env python3
"""
PDF Download and Extract Script
Downloads PDF from URL and extracts text content.
"""

import sys
import os
import tempfile
import json
from pathlib import Path

def download_pdf(url: str, output_path: str = None) -> str:
    """Download PDF from URL."""
    import urllib.request
    import ssl

    if output_path is None:
        output_path = tempfile.mktemp(suffix='.pdf')

    # Create SSL context that ignores certificate verification
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }

    req = urllib.request.Request(url, headers=headers)

    with urllib.request.urlopen(req, context=ctx) as response:
        with open(output_path, 'wb') as f:
            f.write(response.read())

    return output_path


def extract_text_pdfplumber(pdf_path: str) -> str:
    """Extract text using pdfplumber."""
    try:
        import pdfplumber

        text = []
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    text.append(f"=== Page {i+1} ===\n{page_text}")

        return "\n\n".join(text)
    except ImportError:
        return None


def extract_text_pypdf(pdf_path: str) -> str:
    """Extract text using pypdf."""
    try:
        from pypdf import PdfReader

        reader = PdfReader(pdf_path)
        text = []

        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text.append(f"=== Page {i+1} ===\n{page_text}")

        return "\n\n".join(text)
    except ImportError:
        return None


def extract_text_pdftotext(pdf_path: str) -> str:
    """Extract text using pdftotext command."""
    import subprocess

    try:
        result = subprocess.run(
            ['pdftotext', '-layout', pdf_path, '-'],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            return result.stdout
    except FileNotFoundError:
        pass

    return None


def extract_text(pdf_path: str) -> str:
    """Try multiple extraction methods."""
    # Try pdfplumber first (best for tables)
    text = extract_text_pdfplumber(pdf_path)
    if text:
        return text

    # Try pypdf
    text = extract_text_pypdf(pdf_path)
    if text:
        return text

    # Try pdftotext command
    text = extract_text_pdftotext(pdf_path)
    if text:
        return text

    return "Error: No PDF extraction library available. Install: pip install pdfplumber pypdf"


def get_metadata(pdf_path: str) -> dict:
    """Get PDF metadata."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        meta = reader.metadata

        return {
            "title": str(meta.title) if meta.title else None,
            "author": str(meta.author) if meta.author else None,
            "subject": str(meta.subject) if meta.subject else None,
            "creator": str(meta.creator) if meta.creator else None,
            "pages": len(reader.pages)
        }
    except Exception as e:
        return {"error": str(e)}


def main():
    if len(sys.argv) < 2:
        print("Usage: python download_pdf.py <url_or_path> [--metadata] [--output <file>]")
        sys.exit(1)

    source = sys.argv[1]
    metadata_only = "--metadata" in sys.argv
    output_file = None

    if "--output" in sys.argv:
        output_idx = sys.argv.index("--output")
        if output_idx + 1 < len(sys.argv):
            output_file = sys.argv[output_idx + 1]

    # Download if URL
    if source.startswith(('http://', 'https://')):
        print(f"Downloading: {source}", file=sys.stderr)
        pdf_path = download_pdf(source)
        cleanup = True
    else:
        pdf_path = source
        cleanup = False

    try:
        if metadata_only:
            result = json.dumps(get_metadata(pdf_path), indent=2, ensure_ascii=False)
        else:
            result = extract_text(pdf_path)

        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(result)
            print(f"Saved to: {output_file}", file=sys.stderr)
        else:
            print(result)

    finally:
        if cleanup and os.path.exists(pdf_path):
            os.remove(pdf_path)


if __name__ == "__main__":
    main()
