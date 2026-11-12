"""Optional recovery download. The included snapshot is the normal input.

Do not refresh just to run the project. An agency may replace a URL's contents.
Existing files are never overwritten; use a new project folder for a new version.
"""
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "data/raw/dot_bridgereport24.pdf"
URL = "https://www.nyc.gov/html/dot/downloads/pdf/dot_bridgereport24.pdf"

if DEST.exists():
    print(f"Using included snapshot: {DEST}")
else:
    DEST.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(URL, headers={"User-Agent": "NYU-Information-Visualization-Coursework/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            contents = response.read()
        if not contents.startswith(b"%PDF-"):
            raise ValueError("Response is not a PDF; do not save an error page as data.")
        DEST.write_bytes(contents)
        print(f"Downloaded {len(contents):,} bytes to {DEST}")
    except Exception as error:
        raise SystemExit(f"Download failed: {error}. Use the included source PDF from the ZIP.")
