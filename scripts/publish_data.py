"""Copy the audited extraction into the app, then rebuild the standalone file."""
import json
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
processed = ROOT / "data/processed"
destination = ROOT / "dist/data"
rows = json.loads((processed / "bridges_2024.json").read_text())
if len(rows) != 813 or len({row["bin"] for row in rows}) != 813:
    raise ValueError("Expected the complete 813-record inventory. Inspect extraction first.")
destination.mkdir(parents=True, exist_ok=True)
for name in ("bridges_2024.json", "bridges_2024.csv"):
    shutil.copy2(processed / name, destination / name)
subprocess.run([sys.executable, str(ROOT / "scripts/build_standalone.py")], check=True)
print("Published the full audited inventory to dist/data.")
