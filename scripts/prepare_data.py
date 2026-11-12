"""Extract the official 2024 inventory table and preserve row provenance.

Run from any directory: python scripts/prepare_data.py
This reads the included frozen PDF. It never merges undated Open Data rows.
"""
import csv
import hashlib
import json
from datetime import datetime
from pathlib import Path
import sys
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from src.data_model import CONDITIONS, BOROUGH_GROUPS, LEGACY_BINS
from src.data_model import borough_group, span_band, overview, group_summary

SOURCE = ROOT / "data/raw/dot_bridgereport24.pdf"
EXPECTED_COUNTS = {"Poor": 8, "Fair": 518, "Good": 223, "Very good": 54, "Closed": 10}
NAMES = ["bin", "boro", "feature_carried", "feature_crossed", "rail_road",
         "bridge_type", "other_owner", "spans", "rating_source", "inspection_date",
         "general_recommendation", "current_rating", "verbal_rating",
         "deck_area_sq_ft", "replacement_cost", "cd", "cd2", "cd3"]
LABELS = {"POOR": "Poor", "FAIR": "Fair", "GOOD": "Good",
          "VGOOD": "Very good", "CLOSED": "Closed"}


def extract():
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Missing source PDF: {SOURCE}. Restore it from the ZIP, or run scripts/download_source.py.")
    rows, discarded = [], []
    with pdfplumber.open(SOURCE) as pdf:
        if len(pdf.pages) != 77:
            raise ValueError("Source layout changed: expected 77 PDF pages. Recheck the inventory page range.")
        # PDF pages 34-66 correspond to printed pages 32-64. End is exclusive.
        for index in range(33, 66):
            tables = pdf.pages[index].extract_tables()
            if len(tables) != 1 or len(tables[0][0]) != 18:
                raise ValueError(f"Unexpected table structure on PDF page {index + 1}.")
            for cells in tables[0][1:]:
                cleaned = [" ".join((cell or "").split()) for cell in cells]
                if not any(cleaned):
                    continue
                if len(cleaned) != 18:
                    raise ValueError(f"Unexpected number of cells on PDF page {index + 1}.")
                if cleaned[12] not in LABELS:
                    # The last page contains a summary/footer, not a structure.
                    discarded.append({"pdf_page": index + 1, "cells": cleaned})
                    continue
                row = dict(zip(NAMES, cleaned))
                row["bridge_type"] = row["bridge_type"].replace(" ", "")
                row["spans"] = int(row["spans"])
                row["deck_area_sq_ft"] = float(row["deck_area_sq_ft"].replace(",", ""))
                row["replacement_cost"] = float(row["replacement_cost"].replace("$", "").replace(",", ""))
                row["current_rating"] = float(row["current_rating"])
                # Preserve the date as ISO text; dates have no published timezone.
                row["inspection_date"] = datetime.strptime(row["inspection_date"], "%m/%d/%Y").date().isoformat()
                row["inspection_year"] = int(row["inspection_date"][:4])
                row["condition"] = LABELS[row["verbal_rating"]]
                row["condition_rank"] = CONDITIONS.index(row["condition"]) + 1 if row["condition"] != "Closed" else None
                row["borough_group"] = borough_group(row["boro"])
                row["pedestrian_code"] = "PED-coded" if "PED" in row["bridge_type"] else "Other codes"
                row["span_band"] = span_band(row["spans"])
                row["rating_basis"] = "Legacy exception" if row["bin"] in LEGACY_BINS else "NBI-W"
                row["snapshot_year"] = 2024
                row["source_pdf_page"] = index + 1
                row["source_printed_page"] = index - 1
                rows.append(row)
    if len(rows) != 813 or len({row["bin"] for row in rows}) != 813:
        raise ValueError("Inventory must contain 813 unique BINs; inspect extraction rather than silently deduplicating.")
    if overview(rows)["condition_counts"] != EXPECTED_COUNTS:
        raise ValueError("Extracted condition counts do not match the report's printed page 22.")
    if any(row["deck_area_sq_ft"] <= 0 or row["spans"] <= 0 for row in rows):
        raise ValueError("Nonpositive deck area or spans: inspect source before plotting logarithmic values.")
    if {row["bin"] for row in rows if row["rating_basis"] == "Legacy exception"} != LEGACY_BINS:
        raise ValueError("Legacy exception list does not match the inventory.")
    rows.sort(key=lambda row: row["bin"])
    return rows, discarded


def main():
    rows, discarded = extract()
    folder = ROOT / "data/processed"
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "bridges_2024.json").write_text(json.dumps(rows, indent=2) + "\n")
    with (folder / "bridges_2024.csv").open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    summary = overview(rows)
    summary.update({"conditions": group_summary(rows, "condition", CONDITIONS),
                    "boroughs": group_summary(rows, "borough_group", BOROUGH_GROUPS),
                    "inspection_date_min": min(row["inspection_date"] for row in rows),
                    "inspection_date_max": max(row["inspection_date"] for row in rows),
                    "unknown_borough_bins": [row["bin"] for row in rows if row["borough_group"] == "Unknown"],
                    "footer_open_area_sq_ft": 15700477,
                    "computed_nonclosed_area_sq_ft": sum(row["deck_area_sq_ft"] for row in rows if row["condition"] != "Closed"),
                    "discarded_footer_rows": discarded,
                    "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
                    "source_url": "https://www.nyc.gov/html/dot/downloads/pdf/dot_bridgereport24.pdf",
                    "retrieved_date": "2026-10-14"})
    (folder / "audit.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(f"Prepared {len(rows)} unique structures; deck area {summary['deck_area_sq_ft']:,.1f} sq ft.")
    print("Condition counts match the official summary. Footer area discrepancy is preserved in audit.json.")


if __name__ == "__main__":
    main()
