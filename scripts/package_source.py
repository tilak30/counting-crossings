"""Make a portable project ZIP without credentials, Git metadata or local caches."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / "dist/Counting_Crossings_Source.zip"
files = [ROOT / name for name in (
    "README.md", "package.json", "requirements.txt", "Counting_Crossings.html"
)]
for folder in ("dist", "data/raw", "data/processed", "src", "scripts", "tests", "docs"):
    files.extend(path for path in (ROOT / folder).rglob("*")
                 if path.is_file() and path.suffix not in (".zip", ".pyc")
                 and "__pycache__" not in path.parts)
with ZipFile(target, "w", ZIP_DEFLATED) as archive:
    for path in sorted(set(files)):
        archive.write(path, Path("Counting_Crossings") / path.relative_to(ROOT))
print(f"Packaged {len(set(files))} files in {target.name} ({target.stat().st_size:,} bytes).")
